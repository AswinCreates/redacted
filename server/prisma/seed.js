import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultData = [
  {
    category: 'General',
    words: [
      { word: 'Umbrella', hint: 'Rainy Day Accessory' },
      { word: 'Airplane', hint: 'Mode of Transport' },
      { word: 'Toothbrush', hint: 'Bathroom Item' },
      { word: 'Mirror', hint: 'Reflective Object' },
      { word: 'Guitar', hint: 'Musical Instrument' },
      { word: 'Candle', hint: 'Source of Light' },
    ],
  },
  {
    category: 'Food',
    words: [
      { word: 'Pizza', hint: 'Italian Dish' },
      { word: 'Sushi', hint: 'Japanese Cuisine' },
      { word: 'Taco', hint: 'Mexican Street Food' },
      { word: 'Burger', hint: 'American Fast Food' },
    ],
  },
  {
    category: 'Animals',
    words: [
      { word: 'Elephant', hint: 'Large Land Mammal' },
      { word: 'Penguin', hint: 'Flightless Bird' },
      { word: 'Dolphin', hint: 'Marine Mammal' },
      { word: 'Kangaroo', hint: 'Australian Marsupial' },
    ],
  },
  {
    category: 'Tech',
    words: [
      { word: 'Smartphone', hint: 'Pocket Device' },
      { word: 'Laptop', hint: 'Portable Computer' },
      { word: 'Headphones', hint: 'Audio Accessory' },
      { word: 'Camera', hint: 'Captures Images' },
    ],
  },
  {
    category: 'Movies',
    words: [
      { word: 'Titanic', hint: 'Famous Shipwreck Film' },
      { word: 'Avatar', hint: 'Blue Alien Blockbuster' },
      { word: 'Inception', hint: 'Dream-Within-A-Dream' },
      { word: 'Jaws', hint: 'Shark Thriller' },
    ],
  },
  {
    category: 'Places',
    words: [
      { word: 'Eiffel Tower', hint: 'Paris Landmark' },
      { word: 'Beach', hint: 'Sandy Shoreline' },
      { word: 'Hospital', hint: 'Medical Building' },
      { word: 'Airport', hint: 'Where Flights Depart' },
    ],
  },
];

async function main() {
  console.log('Seeding initial categories and word bank...');
  for (const group of defaultData) {
    const category = await prisma.category.upsert({
      where: { name: group.category },
      update: {},
      create: { name: group.category },
    });

    for (const item of group.words) {
      await prisma.word.upsert({
        where: {
          word_categoryId: {
            word: item.word,
            categoryId: category.id,
          },
        },
        update: { hint: item.hint },
        create: {
          word: item.word,
          hint: item.hint,
          categoryId: category.id,
        },
      });
    }
  }
  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });