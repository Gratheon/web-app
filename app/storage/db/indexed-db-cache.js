import Dexie from 'dexie';
import { InMemoryCache } from '@apollo/client'

// Create a new Dexie database
const db = new Dexie('gratheon-app-db');

db.version(1).stores({
  entries: '++id, data'
});

export class IndexedDBCache extends InMemoryCache {
  constructor() {
    super();
  }

  // Override the InMemoryCache's write function to also store the data in Dexie
  write(write) {
    console.log('write', {write});
    super.write(write);

    // Add the data to the 'entries' table in the Dexie database
    db.entries.add({ data: write.result });
  }

  // Override the InMemoryCache's read function to check for data in Dexie first
  read(query) {
    console.log('read', { query });
    return db.entries
      .where({ id: query.dataId })
      .first()
      .then((entry) => {
        // If the data was found in the 'entries' table, return it
        if (entry) return { data: entry.data };

        // If the data was not found, fall back to the InMemoryCache implementation
        return super.read(query);
      });
  }
}