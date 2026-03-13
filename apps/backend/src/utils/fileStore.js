import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '../data/store.json');

// Write lock: chains all writes sequentially to prevent race conditions
let writeLock = Promise.resolve();

export async function readStore() {
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function writeStore(data) {
  writeLock = writeLock.then(async () => {
    await fs.writeFile(STORE_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  });
  await writeLock;
  return data;
}
