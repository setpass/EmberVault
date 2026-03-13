import { readStore, writeStore } from '../utils/fileStore.js';

export async function getAllData() {
  return readStore();
}

export async function getCollection(key) {
  const store = await readStore();
  return store[key];
}

/**
 * Smart update:
 * - Array body → bulk-replace the collection
 * - Object with id → patch that single item by ID
 * - Object without id (e.g. profile) → shallow merge
 */
export async function updateCollection(key, value) {
  const store = await readStore();

  if (Array.isArray(value)) {
    store[key] = value;
  } else if (value?.id && Array.isArray(store[key])) {
    const index = store[key].findIndex((item) => item.id === value.id);
    if (index === -1) {
      const err = new Error(`Item with id "${value.id}" not found in "${key}".`);
      err.status = 404;
      throw err;
    }
    store[key][index] = { ...store[key][index], ...value };
  } else {
    store[key] = { ...store[key], ...value };
  }

  await writeStore(store);
  return store[key];
}

export async function createCollectionItem(key, payload) {
  const store = await readStore();
  const collection = store[key];
  const item = {
    id: payload.id || `${key}-${Date.now()}`,
    ...payload,
  };
  store[key] = [item, ...collection];
  await writeStore(store);
  return item;
}
