import prisma from '../config/prisma.js';

export class WordBank {
  constructor() {
    // Local memory cache for fast word picking during game start
    this.categories = new Map(); // categoryName -> Array<{ word, hint }>
  }

  /**
   * Preloads categories and words from PostgreSQL into memory cache.
   */
  async initialize() {
    try {
      const data = await prisma.category.findMany({
        include: { words: true },
      });

      this.categories.clear();
      for (const cat of data) {
        if (cat.words && cat.words.length > 0) {
          this.categories.set(cat.name, cat.words.map(w => ({ word: w.word, hint: w.hint })));
        }
      }
      console.log(`[WordBank] Initialized with ${this.categories.size} categories.`);
    } catch (error) {
      console.error('[WordBank] Failed to load word bank from DB:', error);
      // Fallback in-memory dataset in case DB is unseeded
      this.categories.set('General', [
        { word: 'Pizza', hint: 'Italian Dish' },
        { word: 'Elephant', hint: 'Large Land Mammal' },
        { word: 'Guitar', hint: 'Musical Instrument' },
      ]);
    }
  }

  /**
   * Gets list of available category names for lobby settings.
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Randomly selects a word and category hint.
   * Fallback to 'General' if selected category is unavailable or empty.
   */
  getRandomWord(categoryName) {
    let pool = this.categories.get(categoryName);
    if (!pool || pool.length === 0) {
      pool = this.categories.get('General') || [
        { word: 'Coffee', hint: 'Popular Morning Beverage' },
      ];
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }
}

// Global Singleton Instance
export const wordBank = new WordBank();