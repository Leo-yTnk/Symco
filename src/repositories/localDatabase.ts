import type { Database } from "../domain/model";
import { createSeed } from "../domain/seed";

const KEY = "symos-database-v1";
export interface DatabaseRepository {
  load(): Database;
  save(database: Database): void;
}

export const localDatabase: DatabaseRepository = {
  load() {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const database = JSON.parse(stored) as Database;
        if (database.version === 1 && Array.isArray(database.projects))
          return database;
      }
    } catch {
      /* Corrupt or unavailable storage falls back to a fresh session. */
    }
    const seed = createSeed();
    try {
      localStorage.setItem(KEY, JSON.stringify(seed));
    } catch {
      /* Browsing can still continue without persistence. */
    }
    return seed;
  },
  save(database) {
    localStorage.setItem(KEY, JSON.stringify(database));
  },
};
