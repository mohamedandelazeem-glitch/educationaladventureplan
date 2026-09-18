export interface AdventureRecord {
  id: string;
  imageBase64: string[];
  lessonTitle: string;
  generatedScript: string;
  timestampsData: object[];
  createdAt: string;
  sourceFacts?: string[];
  concepts?: string[];
  scenes?: object[];
  questions?: object[];
  animationStates?: object;
  mediaUrl?: string;
  audioUrl?: string;
  generationStatus?: 'pending' | 'generating' | 'ready' | 'failed';
}

const DB_NAME = 'edventures_db';
const DB_VERSION = 1;
const STORE_NAME = 'adventures';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAdventure(record: AdventureRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getAdventure(id: string): Promise<AdventureRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => { db.close(); resolve((req.result as AdventureRecord) ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getAllAdventures(): Promise<AdventureRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      db.close();
      const records = (req.result as AdventureRecord[]) ?? [];
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(records);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteAdventure(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearAdventures(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
