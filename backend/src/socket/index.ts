import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let ioInstance: SocketIOServer | null = null;

export const initSocket = (server: HttpServer, clientUrl: string) => {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Optional authentication check for sockets
  ioInstance.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        socket.data.user = decoded;
      } catch (err) {
        // Continue as unauthenticated guest for viewing products
      }
    }
    next();
  });

  ioInstance.on('connection', (socket: Socket) => {
    // Join personal user room for direct notifications and private enquiry pings
    if (socket.data.user?.id) {
      socket.join(`user_${socket.data.user.id}`);
    }

    // Join room for specific live product page (real-time price updates)
    socket.on('join_product_room', (productId: string) => {
      socket.join(`product_${productId}`);
    });

    socket.on('leave_product_room', (productId: string) => {
      socket.leave(`product_${productId}`);
    });

    // Join room for a specific enquiry chat conversation
    socket.on('join_enquiry_room', (enquiryId: string) => {
      socket.join(`enquiry_${enquiryId}`);
    });

    socket.on('disconnect', () => {
      // Automatic cleanup handled by socket.io
    });
  });

  return ioInstance;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};