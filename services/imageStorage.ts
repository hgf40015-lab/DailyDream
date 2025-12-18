
import { DreamImage } from '../types';

const DB_NAME = 'DreamAppGalleryDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Create store with 'id' as keyPath
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveImageToDB = async (image: DreamImage): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(image);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getImageCount = async (): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get images with pagination (descending order by ID/Date roughly)
export const getImagesFromDB = async (offset: number, limit: number): Promise<DreamImage[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const images: DreamImage[] = [];
        let hasAdvanced = false;
        
        // Open cursor at the end to get newest items first (prev)
        const request = store.openCursor(null, 'prev'); 

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            
            if (!cursor) {
                resolve(images);
                return;
            }

            if (offset > 0 && !hasAdvanced) {
                hasAdvanced = true;
                cursor.advance(offset);
                return;
            }

            if (images.length < limit) {
                images.push(cursor.value);
                cursor.continue();
            } else {
                resolve(images);
            }
        };

        request.onerror = () => reject(request.error);
    });
};
