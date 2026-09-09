import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { initSocket, getIO } from './socket';
import { authenticateToken, requireRole, AuthenticatedRequest } from './middleware/auth.middleware';
import { calculateDistanceKm } from './utils/geo';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

initSocket(server, CLIENT_URL);

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure local storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Serve the uploads folder publicly so the frontend can display the images
app.use('/uploads', express.static(uploadDir));

// The Image Upload API Endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  
  // Construct the full URL to the image (e.g., http://localhost:5000/uploads/12345.jpg)
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ success: true, imageUrl });
});

// ---------------------------------------------------------------------------
// 1. AUTHENTICATION MODULE
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().min(10),
  role: z.enum(['FARMER', 'CONSUMER']),
  farmName: z.string().optional(),
  bio: z.string().optional(),
  district: z.string().optional(),
  addressLine: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        phone: body.phone,
        role: body.role,
        ...(body.role === 'FARMER'
          ? {
              farmerProfile: {
                create: {
                  farmName: body.farmName || `${body.name}'s Farm`,
                  bio: body.bio || '',
                  district: body.district || 'Mandya',
                  addressLine: body.addressLine || 'Farm address',
                  latitude: body.latitude || 12.5218,
                  longitude: body.longitude || 76.8932,
                },
              },
            }
          : {
              consumerProfile: {
                create: {
                  district: body.district || 'Bengaluru',
                  latitude: body.latitude || 12.9716,
                  longitude: body.longitude || 77.5946,
                },
              },
            }),
      },
      include: { farmerProfile: true, consumerProfile: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmerProfile: user.farmerProfile,
          consumerProfile: user.consumerProfile,
        },
      },
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || 'Validation error' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { farmerProfile: true, consumerProfile: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Admin.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmerProfile: user.farmerProfile,
          consumerProfile: user.consumerProfile,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2. PRODUCT & LIVE MARKETPLACE MODULE
// ---------------------------------------------------------------------------

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { search, category, district, organic, minPrice, maxPrice, userLat, userLon, sortBy } = req.query;

    const where: any = { isAvailable: true };

    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { farmer: { farmName: { contains: String(search) } } },
      ];
    }

    if (category) {
      where.category = { slug: String(category) };
    }

    if (district) {
      where.farmer = { ...where.farmer, district: { equals: String(district) } };
    }

    if (organic === 'true') {
      where.isOrganic = true;
    }

    if (minPrice || maxPrice) {
      where.farmerPrice = {};
      if (minPrice) where.farmerPrice.gte = parseFloat(String(minPrice));
      if (maxPrice) where.farmerPrice.lte = parseFloat(String(maxPrice));
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { farmerPrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { farmerPrice: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        farmer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    const formatted = products.map((prod: any) => {
      let distanceKm: number | null = null;
      if (userLat && userLon) {
        distanceKm = calculateDistanceKm(
          parseFloat(String(userLat)),
          parseFloat(String(userLon)),
          prod.farmer.latitude,
          prod.farmer.longitude
        );
      }
      return {
        ...prod,
        farmerPriceNotice: 'Farmer Listed Price',
        distanceKm,
      };
    });

    if (sortBy === 'nearest' && userLat && userLon) {
      formatted.sort((a: any, b: any) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    }

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const product = await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        category: true,
        priceHistories: { orderBy: { changedAt: 'desc' }, take: 5 },
        farmer: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
      },
    });

    await prisma.farmerProfile.update({
      where: { id: product.farmerId },
      data: { profileViews: { increment: 1 } },
    });

    return res.json({
      success: true,
      data: { ...product, farmerPriceNotice: 'Farmer Listed Price' },
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
});

app.post('/api/products', authenticateToken, requireRole(['FARMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!farmer) return res.status(400).json({ success: false, message: 'Farmer profile required' });

    const { title, description, categoryId, farmerPrice, priceUnit, quantityAvailable, quantityUnit, isOrganic, imageUrl } = req.body;

    const product = await prisma.product.create({
      data: {
        farmerId: farmer.id,
        categoryId,
        title,
        description,
        farmerPrice: parseFloat(farmerPrice),
        priceUnit: priceUnit || 'PER_KG',
        quantityAvailable: parseFloat(quantityAvailable),
        quantityUnit: quantityUnit || 'KG',
        isOrganic: Boolean(isOrganic),
        imageUrl,
      },
      include: { category: true, farmer: true },
    });

    getIO().emit('new_product_listed', {
      id: product.id,
      title: product.title,
      farmerPrice: product.farmerPrice,
      district: farmer.district,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/products/:id', authenticateToken, requireRole(['FARMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    const currentProd = await prisma.product.findUnique({ where: { id } });

    if (!currentProd || currentProd.farmerId !== farmer?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this crop' });
    }

    const { farmerPrice, quantityAvailable, isAvailable } = req.body;
    const oldPrice = Number(currentProd.farmerPrice);
    const newPrice = farmerPrice !== undefined ? parseFloat(farmerPrice) : oldPrice;

    if (farmerPrice !== undefined && oldPrice !== newPrice) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          oldPrice,
          newPrice,
        },
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(farmerPrice !== undefined ? { farmerPrice: newPrice } : {}),
        ...(quantityAvailable !== undefined ? { quantityAvailable: parseFloat(quantityAvailable) } : {}),
        ...(isAvailable !== undefined ? { isAvailable: Boolean(isAvailable) } : {}),
      },
      include: { category: true, farmer: true },
    });

    const io = getIO();
    io.to(`product_${id}`).emit('product_updated', {
      productId: id,
      farmerPrice: updated.farmerPrice,
      quantityAvailable: updated.quantityAvailable,
      isAvailable: updated.isAvailable,
      updatedAt: updated.updatedAt,
      notice: 'Farmer Listed Price',
    });

    if (newPrice < oldPrice) {
      const favs = await prisma.favouriteProduct.findMany({
        where: { productId: id },
        include: { consumer: true },
      });

      for (const fav of favs) {
        await prisma.notification.create({
          data: {
            userId: fav.consumer.userId,
            title: 'Price Drop Alert!',
            message: `${updated.title} price dropped from ₹${oldPrice} to ₹${newPrice}!`,
            type: 'PRICE_DROP',
            link: `/products/${id}`,
          },
        });
        io.to(`user_${fav.consumer.userId}`).emit('new_notification', {
          title: 'Price Drop Alert!',
          message: `${updated.title} price dropped to ₹${newPrice}!`,
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3. ENQUIRY & REAL-TIME CHAT MODULE
// ---------------------------------------------------------------------------

app.post('/api/enquiries', authenticateToken, requireRole(['CONSUMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, subject, message } = req.body;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farmer: { include: { user: true } } },
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const enquiry = await prisma.enquiry.create({
      data: {
        productId,
        consumerId: req.user!.id,
        farmerId: product.farmerId,
        subject,
        messages: {
          create: {
            senderId: req.user!.id,
            content: message,
          },
        },
      },
      include: { messages: true, product: true },
    });

    await prisma.notification.create({
      data: {
        userId: product.farmer.userId,
        title: 'New Crop Enquiry',
        message: `New enquiry received regarding "${product.title}": ${subject}`,
        type: 'ENQUIRY_MSG',
        link: `/farmer/enquiries/${enquiry.id}`,
      },
    });

    getIO().to(`user_${product.farmer.userId}`).emit('new_notification', {
      title: 'New Crop Enquiry',
      message: `Enquiry received for ${product.title}`,
    });

    return res.status(201).json({ success: true, data: enquiry });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/enquiries/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { content } = req.body;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { farmer: { include: { user: true } }, consumer: true },
    });

    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry thread not found' });

    const isFarmer = enquiry.farmer.userId === req.user!.id;
    const isConsumer = enquiry.consumerId === req.user!.id;

    if (!isFarmer && !isConsumer) {
      return res.status(403).json({ success: false, message: 'Not authorized in this conversation' });
    }

    const message = await prisma.message.create({
      data: {
        enquiryId: id,
        senderId: req.user!.id,
        content,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    const recipientUserId = isFarmer ? enquiry.consumerId : enquiry.farmer.userId;

    getIO().to(`enquiry_${id}`).emit('new_chat_message', message);

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        title: 'New Message in Enquiry',
        message: `${message.sender.name}: ${content.substring(0, 60)}...`,
        type: 'ENQUIRY_MSG',
        link: `/enquiries/${id}`,
      },
    });

    getIO().to(`user_${recipientUserId}`).emit('new_notification', {
      title: 'New Message',
      message: `${message.sender.name} replied to your enquiry`,
    });

    return res.status(201).json({ success: true, data: message });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4. MAP & NEARBY FARMERS MODULE
// ---------------------------------------------------------------------------

app.get('/api/farmers/map', async (req: Request, res: Response) => {
  try {
    const { lat, lon, maxDistanceKm } = req.query;

    const farmers = await prisma.farmerProfile.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        products: {
          where: { isAvailable: true },
          select: { id: true, title: true, farmerPrice: true, priceUnit: true, isOrganic: true },
        },
      },
    });

    let results = farmers.map((f: any) => {
      let distanceKm = null;
      if (lat && lon) {
        distanceKm = calculateDistanceKm(
          parseFloat(String(lat)),
          parseFloat(String(lon)),
          f.latitude,
          f.longitude
        );
      }
      return {
        id: f.id,
        farmName: f.farmName,
        farmerName: f.user.name,
        district: f.district,
        address: f.addressLine,
        latitude: f.latitude,
        longitude: f.longitude,
        distanceKm,
        isVerified: f.isVerified,
        availableProducts: f.products,
      };
    });

    if (lat && lon && maxDistanceKm) {
      const maxD = parseFloat(String(maxDistanceKm));
      results = results.filter((f: any) => f.distanceKm !== null && f.distanceKm <= maxD);
      results.sort((a: any, b: any) => a.distanceKm! - b.distanceKm!);
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------------------------
// 5. DASHBOARDS & ANALYTICS
// ---------------------------------------------------------------------------

app.get('/api/dashboard/farmer', authenticateToken, requireRole(['FARMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user!.id },
      include: { 
        products: { orderBy: { createdAt: 'desc' } } 
      },
    });

    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer record not found' });

    // Fetch categories for the Add Crop dropdown
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

    const totalProducts = farmer.products.length;
    const availableProducts = farmer.products.filter((p: any) => p.isAvailable).length;
    const totalEnquiries = await prisma.enquiry.count({ where: { farmerId: farmer.id } });
    const totalFavorites = await prisma.favouriteFarmer.count({ where: { farmerId: farmer.id } });

    const recentEnquiries = await prisma.enquiry.findMany({
      where: { farmerId: farmer.id },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        consumer: { select: { name: true, phone: true } },
        product: { select: { title: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    return res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          availableProducts,
          totalEnquiries,
          profileViews: farmer.profileViews,
          totalFavorites,
        },
        recentEnquiries,
        products: farmer.products, // Now returning the crops!
        categories,                // Now returning categories!
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/dashboard/admin', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalConsumers,
      totalProducts,
      activeProducts,
      totalEnquiries,
      pendingComplaints,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.farmerProfile.count(),
      prisma.consumerProfile.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.enquiry.count(),
      prisma.complaint.count({ where: { status: 'PENDING' } }),
    ]);

    const districtBreakdown = await prisma.farmerProfile.groupBy({
      by: ['district'],
      _count: { id: true },
    });

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalFarmers,
          totalConsumers,
          totalProducts,
          activeProducts,
          totalEnquiries,
          pendingComplaints,
        },
        districtBreakdown,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`FARMCONNECT Engine live on http://localhost:${PORT} with WebSocket active.`);
});