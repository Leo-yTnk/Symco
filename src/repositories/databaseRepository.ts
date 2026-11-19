import type { Database } from "../domain/model";

export interface DatabaseRepository {
  load(): Database;
  save(database: Database): void | Promise<void>;
}

export class DatabaseConflict extends Error {}
