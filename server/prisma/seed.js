import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultData = [
  {
    category: 'General',
    words: [
      { word: 'Umbrella', hint: 'Rain' },
      { word: 'Airplane', hint: 'Sky' },
      { word: 'Toothbrush', hint: 'Teeth' },
      { word: 'Mirror', hint: 'Reflection' },
      { word: 'Guitar', hint: 'Strings' },
      { word: 'Candle', hint: 'Wax' },
      { word: 'Backpack', hint: 'Travel' },
      { word: 'Compass', hint: 'North' },
      { word: 'Telescope', hint: 'Stars' },
      { word: 'Lantern', hint: 'Glow' },
      { word: 'Scissors', hint: 'Cut' },
      { word: 'Calendar', hint: 'Dates' },
      { word: 'Pillow', hint: 'Sleep' },
      { word: 'Bicycle', hint: 'Pedals' },
      { word: 'Magnet', hint: 'Attraction' },
      { word: 'Kite', hint: 'Wind' },
    ],
  },
  {
    category: 'Food',
    words: [
      { word: 'Pizza', hint: 'Italian' },
      { word: 'Sushi', hint: 'Japanese' },
      { word: 'Taco', hint: 'Mexican' },
      { word: 'Burger', hint: 'Fastfood' },
      { word: 'Pasta', hint: 'Noodles' },
      { word: 'Biryani', hint: 'Rice' },
      { word: 'Pancake', hint: 'Breakfast' },
      { word: 'Chocolate', hint: 'Cocoa' },
      { word: 'Sandwich', hint: 'Bread' },
      { word: 'Noodles', hint: 'Ramen' },
      { word: 'Croissant', hint: 'Pastry' },
      { word: 'Popcorn', hint: 'Cinema' },
      { word: 'Ice Cream', hint: 'Frozen' },
      { word: 'Samosa', hint: 'Snack' },
      { word: 'Curry', hint: 'Spicy' },
      { word: 'Cheese', hint: 'Dairy' },
    ],
  },
  {
    category: 'Animals',
    words: [
      { word: 'Elephant', hint: 'Trunk' },
      { word: 'Penguin', hint: 'Antarctic' },
      { word: 'Dolphin', hint: 'Ocean' },
      { word: 'Kangaroo', hint: 'Pouch' },
      { word: 'Tiger', hint: 'Stripes' },
      { word: 'Giraffe', hint: 'Neck' },
      { word: 'Panda', hint: 'Bamboo' },
      { word: 'Octopus', hint: 'Tentacles' },
      { word: 'Cheetah', hint: 'Speed' },
      { word: 'Parrot', hint: 'Mimic' },
      { word: 'Crocodile', hint: 'Swamp' },
      { word: 'Owl', hint: 'Night' },
      { word: 'Horse', hint: 'Gallop' },
      { word: 'Whale', hint: 'Giant' },
      { word: 'Chameleon', hint: 'Camouflage' },
      { word: 'Honeybee', hint: 'Honey' },
    ],
  },
  {
    category: 'Tech',
    words: [
      { word: 'Smartphone', hint: 'Pocket' },
      { word: 'Laptop', hint: 'Portable' },
      { word: 'Headphones', hint: 'Audio' },
      { word: 'Camera', hint: 'Photos' },
      { word: 'Keyboard', hint: 'Typing' },
      { word: 'Monitor', hint: 'Display' },
      { word: 'Drone', hint: 'Flying' },
      { word: 'Smartwatch', hint: 'Wrist' },
      { word: 'Router', hint: 'Wifi' },
      { word: 'Printer', hint: 'Paper' },
      { word: 'Tablet', hint: 'Touchscreen' },
      { word: 'Speaker', hint: 'Sound' },
      { word: 'Console', hint: 'Gaming' },
      { word: 'Projector', hint: 'Screening' },
      { word: 'Microphone', hint: 'Voice' },
      { word: 'Charger', hint: 'Power' },
    ],
  },
  {
    category: 'Movies',
    words: [
      { word: 'Titanic', hint: 'Shipwreck' },
      { word: 'Avatar', hint: 'Pandora' },
      { word: 'Inception', hint: 'Dreams' },
      { word: 'Jaws', hint: 'Shark' },
      { word: 'Interstellar', hint: 'Space' },
      { word: 'Avengers', hint: 'Heroes' },
      { word: 'Joker', hint: 'Clown' },
      { word: 'Frozen', hint: 'Ice' },
      { word: 'Batman', hint: 'Gotham' },
      { word: 'Spider-Man', hint: 'Webs' },
      { word: 'Dune', hint: 'Desert' },
      { word: 'Coco', hint: 'Music' },
      { word: 'Gladiator', hint: 'Arena' },
      { word: 'Shrek', hint: 'Ogre' },
      { word: 'Minions', hint: 'Bananas' },
      { word: 'Toy Story', hint: 'Toys' },
    ],
  },
  {
    category: 'Places',
    words: [
      { word: 'Eiffel Tower', hint: 'Paris' },
      { word: 'Beach', hint: 'Sand' },
      { word: 'Hospital', hint: 'Doctors' },
      { word: 'Airport', hint: 'Flights' },
      { word: 'Library', hint: 'Books' },
      { word: 'Museum', hint: 'Artifacts' },
      { word: 'Stadium', hint: 'Sports' },
      { word: 'Cafe', hint: 'Coffee' },
      { word: 'Zoo', hint: 'Animals' },
      { word: 'Desert', hint: 'Dunes' },
      { word: 'Waterfall', hint: 'Cascade' },
      { word: 'Castle', hint: 'Fortress' },
      { word: 'Market', hint: 'Bazaar' },
      { word: 'Bridge', hint: 'Crossing' },
      { word: 'Park', hint: 'Greenery' },
      { word: 'Tunnel', hint: 'Underground' },
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