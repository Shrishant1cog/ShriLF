import { Socket } from "socket.io";

export function registerSocketHandlers(socket: Socket) {
  socket.on("join-enquiry", (enquiryId: string) => {
    socket.join(`enquiry:${enquiryId}`);
  });
}
