import { PrismaClient } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Vegetables",
    "Fruits",
    "Grains & Millets",
    "Spices & Herbs",
    "Cash Crops (Sugarcane, Cotton)",
    "Pulses & Legumes (Dals, Grams)",
    "Oilseeds (Groundnut, Sunflower)",
    "Plantation Crops (Coffee, Arecanut)",
    "Flowers & Floriculture",
    "Nuts & Dry Fruits"
  ];

  console.log("Syncing comprehensive agricultural categories...");

  for (const name of categories) {
    // Generate a URL-friendly slug (e.g., "Grains & Millets" -> "grains-millets")
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if category already exists
    const existing = await prisma.category.findFirst({ where: { name } });
    
    if (!existing) {
      await prisma.category.create({ data: { name, slug } });
      console.log(`✔️ Added new category: ${name}`);
    } else {
      console.log(`➖ Already exists: ${name}`);
    }
  }

  console.log("\n✅ All categories are now available in the database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });