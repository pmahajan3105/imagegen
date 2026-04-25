const PERSISTENCE_DB_NAME = "imagegen-history";
const STATE_STORE = "state";
const ANALYSES_STORE = "analyses";
const STATE_KEY = "latest";
const DB_VERSION = 2;

export type HistoryEntry = {
  id: string;
  title: string;
  prompt: string;
  mode: "Generated" | "Edited" | "Portrait Analysis";
  imageUrl: string;
  createdAt: string;
};

export type PreviewImage = {
  id: string;
  title: string;
  imageUrl: string;
};

export type PersistedState = {
  history: HistoryEntry[];
  selectedPreview: PreviewImage | null;
};

function openPersistenceDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PERSISTENCE_DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(ANALYSES_STORE)) {
        db.createObjectStore(ANALYSES_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePersistedState(state: PersistedState) {
  const database = await openPersistenceDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(state, STATE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

export async function loadPersistedState() {
  const database = await openPersistenceDb();
  const state = await new Promise<PersistedState | undefined>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readonly");
    const request = transaction.objectStore(STATE_STORE).get(STATE_KEY);
    request.onsuccess = () => resolve(request.result as PersistedState | undefined);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return state;
}

export async function clearPersistedState() {
  const database = await openPersistenceDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).delete(STATE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

export async function getCachedAnalysis<T>(key: string): Promise<T | undefined> {
  const database = await openPersistenceDb();
  const value = await new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(ANALYSES_STORE, "readonly");
    const request = transaction.objectStore(ANALYSES_STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return value;
}

export async function saveCachedAnalysis(key: string, analysis: unknown) {
  const database = await openPersistenceDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(ANALYSES_STORE, "readwrite");
    transaction.objectStore(ANALYSES_STORE).put(analysis, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

export async function deleteCachedAnalysis(key: string) {
  const database = await openPersistenceDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(ANALYSES_STORE, "readwrite");
    transaction.objectStore(ANALYSES_STORE).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}
