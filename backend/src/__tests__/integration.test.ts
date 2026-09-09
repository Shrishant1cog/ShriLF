import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

describe('FarmConnect Core Functional Suite', () => {
  let farmerToken: string;
  let consumerToken: string;
  let createdProductId: string;

  beforeAll(async () => {
    const farmerRes = await request(API_URL)
      .post('/auth/login')
      .send({ email: 'ramesh.mandya@farmconnect.org', password: 'Password@123' });
    farmerToken = farmerRes.body.data.token;

    const consumerRes = await request(API_URL)
      .post('/auth/login')
      .send({ email: 'priya.bengaluru@gmail.com', password: 'Password@123' });
    consumerToken = consumerRes.body.data.token;
  });

  it('FARMER: creates a new harvest listing with explicit unit and price', async () => {
    const categories = await prisma.category.findMany();
    const res = await request(API_URL)
      .post('/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        title: 'Fresh Organic Carrots',
        description: 'Crisp, sweet winter carrots directly harvested from Mandya soil.',
        categoryId: categories[0].id,
        farmerPrice: 35.0,
        priceUnit: 'PER_KG',
        quantityAvailable: 150.0,
        quantityUnit: 'KG',
        isOrganic: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Fresh Organic Carrots');
    createdProductId = res.body.data.id;
  });

  it('FARMER: updates price and triggers historical audit trail', async () => {
    const res = await request(API_URL)
      .patch(`/products/${createdProductId}`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        farmerPrice: 32.0,
        quantityAvailable: 120.0,
      });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.farmerPrice)).toBe(32.0);

    const history = await prisma.priceHistory.findFirst({
      where: { productId: createdProductId },
    });
    expect(history).not.toBeNull();
    expect(Number(history!.oldPrice)).toBe(35.0);
    expect(Number(history!.newPrice)).toBe(32.0);
  });

  it('CONSUMER: searches products and validates explicit "Farmer Listed Price" notice', async () => {
    const res = await request(API_URL).get('/products?search=Carrots');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].farmerPriceNotice).toBe('Farmer Listed Price');
  });

  it('SECURITY: denies unauthenticated product deletion or modification', async () => {
    const res = await request(API_URL)
      .patch(`/products/${createdProductId}`)
      .send({ farmerPrice: 10.0 });
    expect(res.status).toBe(401);
  });
});