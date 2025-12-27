import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import seedData from './seed-data.json'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.product.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.admin.deleteMany()

  console.log('Cleared existing data')

  // Create collections
  for (const collection of seedData.collections) {
    await prisma.collection.create({
      data: {
        name: collection.name,
        slug: collection.slug,
        description: `Shop our ${collection.name} collection`,
        image: `/images/collections/${collection.slug}.jpg`,
      },
    })
  }
  console.log(`Created ${seedData.collections.length} collections`)

  // Create products
  for (const product of seedData.products) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        category: product.category,
        collection: product.collection,
        ingredients: product.ingredients,
        benefits: product.benefits,
        howToUse: product.howToUse,
        inStock: product.inStock,
        featured: product.featured,
      },
    })
  }
  console.log(`Created ${seedData.products.length} products`)

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.create({
    data: {
      email: 'admin@ayonne.skin',
      password: hashedPassword,
      name: 'Admin',
    },
  })
  console.log('Created admin user')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
