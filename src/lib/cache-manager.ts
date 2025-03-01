interface CacheConfig {
  maxAge: number;
  maxItems?: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private config: Record<string, CacheConfig> = {
    campaigns: { maxAge: 5 * 60 * 1000, maxItems: 100 }, // 5 minutes
    adGroups: { maxAge: 5 * 60 * 1000, maxItems: 500 },
    metrics: { maxAge: 15 * 60 * 1000, maxItems: 1000 } // 15 minutes
  };

  private constructor() {
    // Clean up expired items periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(key: string, data: any, category: string = 'default'): void {
    const config = this.config[category] || { maxAge: 5 * 60 * 1000 };
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Enforce max items limit
    if (config.maxItems) {
      const categoryItems = Array.from(this.cache.entries())
        .filter(([k]) => k.startsWith(`${category}:`));
      
      if (categoryItems.length > config.maxItems) {
        // Remove oldest items
        const itemsToRemove = categoryItems
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, categoryItems.length - config.maxItems);
        
        itemsToRemove.forEach(([k]) => this.cache.delete(k));
      }
    }
  }

  get<T>(key: string, category: string = 'default'): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const config = this.config[category] || { maxAge: 5 * 60 * 1000 };
    const age = Date.now() - item.timestamp;

    if (age > config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      const category = key.split(':')[0];
      const config = this.config[category] || { maxAge: 5 * 60 * 1000 };
      
      if (now - item.timestamp > config.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateCategory(category: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${category}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = CacheManager.getInstance();