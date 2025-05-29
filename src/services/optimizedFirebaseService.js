// services/optimizedFirebaseService.js
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  documentId,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, appId } from "../firebase";
import {
  compressImage,
  validateAndOptimizeImage,
} from "../utils/imageOptimizer";

class OptimizedFirebaseService {
  constructor() {
    this.queryCache = new Map();
    this.docCache = new Map();
    this.unsubscribers = new Map();
    this.batchOperations = [];
    this.batchTimeout = null;
  }

  // Cache management
  _getCacheKey(collection, filters = {}) {
    return `${collection}_${JSON.stringify(filters)}`;
  }

  _setCache(key, data, ttl = 300000) {
    // 5 minutes default TTL
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Auto-cleanup expired cache
    setTimeout(() => {
      this.queryCache.delete(key);
    }, ttl);
  }

  _getCache(key) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Optimized image upload with compression
  async uploadImage(file, path) {
    try {
      // Validate and optimize image
      const {
        valid,
        file: optimizedFile,
        error,
      } = await validateAndOptimizeImage(file);

      if (!valid) {
        return { success: false, error };
      }

      const imageName = `${Date.now()}_${optimizedFile.name.replace(
        /\s+/g,
        "_"
      )}`;
      const storagePath = `images/${appId}/${path}/${imageName}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, optimizedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { success: true, url: downloadURL, path: storagePath };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { success: false, error: error.message };
    }
  }

  // Batch upload multiple images with progress callback
  async uploadMultipleImages(files, path, onProgress) {
    const results = {
      successful: [],
      failed: [],
    };

    const totalFiles = files.length;
    let completed = 0;

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];

    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (file) => {
        try {
          const result = await this.uploadImage(file, path);

          if (result.success) {
            results.successful.push({ file: file.name, url: result.url });
          } else {
            results.failed.push({ file: file.name, error: result.error });
          }
        } catch (error) {
          results.failed.push({ file: file.name, error: error.message });
        }

        completed++;
        onProgress?.(completed / totalFiles);
      });

      await Promise.all(promises);
    }

    return results;
  }

  // Optimized pagination with cursor-based fetching
  async getItemsPaginated(collectionPath, options = {}) {
    const {
      pageSize = 20,
      lastDoc = null,
      filters = {},
      sortBy = { field: "createdAt", direction: "desc" },
      useCache = true,
    } = options;

    const cacheKey = this._getCacheKey(collectionPath, {
      ...filters,
      lastDoc: lastDoc?.id,
    });

    // Check cache first
    if (useCache && !lastDoc) {
      const cached = this._getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let q = query(collection(db, collectionPath));
      const constraints = [];

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          constraints.push(where(field, "==", value));
        }
      });

      // Apply constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      // Order and pagination
      q = query(
        q,
        orderBy(sortBy.field, sortBy.direction),
        limit(pageSize + 1) // Fetch one extra to check if there are more
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.slice(0, pageSize).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastVisible = snapshot.docs[pageSize - 1];
      const hasMore = snapshot.docs.length > pageSize;

      const result = {
        success: true,
        items,
        lastVisible,
        hasMore,
        totalFetched: items.length,
      };

      // Cache the result
      if (useCache && !lastDoc) {
        this._setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error("Error fetching paginated items:", error);
      return { success: false, error: error.message, items: [] };
    }
  }

  // Batch fetch items by IDs (optimized for Firestore's 10-item 'in' query limit)
  async getItemsByIds(collectionPath, ids) {
    if (!ids || ids.length === 0) {
      return { success: true, items: [] };
    }

    // Check cache for individual docs
    const uncachedIds = [];
    const cachedItems = [];

    ids.forEach((id) => {
      const cached = this.docCache.get(`${collectionPath}_${id}`);
      if (cached) {
        cachedItems.push(cached);
      } else {
        uncachedIds.push(id);
      }
    });

    if (uncachedIds.length === 0) {
      return { success: true, items: cachedItems };
    }

    try {
      const batches = [];
      const batchSize = 10; // Firestore 'in' query limit

      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        batches.push(
          getDocs(
            query(
              collection(db, collectionPath),
              where(documentId(), "in", batch)
            )
          )
        );
      }

      const results = await Promise.all(batches);
      const fetchedItems = results.flatMap((snapshot) =>
        snapshot.docs.map((doc) => {
          const item = { id: doc.id, ...doc.data() };
          // Cache individual items
          this.docCache.set(`${collectionPath}_${doc.id}`, item);
          return item;
        })
      );

      return {
        success: true,
        items: [...cachedItems, ...fetchedItems],
      };
    } catch (error) {
      console.error("Error batch fetching items:", error);
      return { success: false, error: error.message, items: [] };
    }
  }

  // Real-time subscription with automatic reconnection
  subscribeToCollection(collectionPath, options = {}) {
    const {
      filters = {},
      sortBy = { field: "createdAt", direction: "desc" },
      limit: docLimit = 50,
      onUpdate,
      onError,
    } = options;

    const subscriptionKey = this._getCacheKey(collectionPath, filters);

    // Unsubscribe from existing subscription
    if (this.unsubscribers.has(subscriptionKey)) {
      this.unsubscribers.get(subscriptionKey)();
    }

    let q = query(collection(db, collectionPath));
    const constraints = [];

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        constraints.push(where(field, "==", value));
      }
    });

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    q = query(q, orderBy(sortBy.field, sortBy.direction), limit(docLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update cache
        this._setCache(subscriptionKey, { success: true, items }, 600000); // 10 min TTL

        onUpdate?.(items);
      },
      (error) => {
        console.error("Subscription error:", error);
        onError?.(error);

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          this.subscribeToCollection(collectionPath, options);
        }, 5000);
      }
    );

    this.unsubscribers.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  // Batch operations for better performance
  async batchOperation(operation) {
    this.batchOperations.push(operation);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatchOperations();
    }, 100); // Execute batch after 100ms of inactivity
  }

  async executeBatchOperations() {
    if (this.batchOperations.length === 0) return;

    const operations = [...this.batchOperations];
    this.batchOperations = [];

    try {
      await Promise.all(operations);
    } catch (error) {
      console.error("Batch operation error:", error);
    }
  }

  // Add item with offline support
  async addItem(collectionPath, data) {
    try {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Invalidate relevant caches
      this.invalidateCollectionCache(collectionPath);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding item:", error);

      // Store in local storage for retry
      if (typeof window !== "undefined" && window.localStorage) {
        const pendingOps = JSON.parse(
          localStorage.getItem("pendingOperations") || "[]"
        );
        pendingOps.push({
          type: "add",
          collection: collectionPath,
          data,
          timestamp: Date.now(),
        });
        localStorage.setItem("pendingOperations", JSON.stringify(pendingOps));
      }

      return { success: false, error: error.message };
    }
  }

  // Update item with optimistic updates
  async updateItem(collectionPath, docId, updates) {
    const docRef = doc(db, collectionPath, docId);

    try {
      await setDoc(
        docRef,
        {
          ...updates,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      // Update cache optimistically
      const cacheKey = `${collectionPath}_${docId}`;
      if (this.docCache.has(cacheKey)) {
        const cached = this.docCache.get(cacheKey);
        this.docCache.set(cacheKey, { ...cached, ...updates });
      }

      // Invalidate collection cache
      this.invalidateCollectionCache(collectionPath);

      return { success: true };
    } catch (error) {
      console.error("Error updating item:", error);
      return { success: false, error: error.message };
    }
  }

  // Delete item with cascade
  async deleteItem(collectionPath, docId, imagePaths = []) {
    try {
      // Delete document
      await deleteDoc(doc(db, collectionPath, docId));

      // Delete associated images
      if (imagePaths.length > 0) {
        const deletePromises = imagePaths.map((path) =>
          deleteObject(ref(storage, path)).catch((err) =>
            console.error(`Failed to delete image: ${path}`, err)
          )
        );
        await Promise.all(deletePromises);
      }

      // Remove from cache
      this.docCache.delete(`${collectionPath}_${docId}`);
      this.invalidateCollectionCache(collectionPath);

      return { success: true };
    } catch (error) {
      console.error("Error deleting item:", error);
      return { success: false, error: error.message };
    }
  }

  // Invalidate collection cache
  invalidateCollectionCache(collectionPath) {
    // Remove all cache entries for this collection
    this.queryCache.forEach((value, key) => {
      if (key.startsWith(collectionPath)) {
        this.queryCache.delete(key);
      }
    });
  }

  // Cleanup method
  cleanup() {
    // Unsubscribe from all subscriptions
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();

    // Clear caches
    this.queryCache.clear();
    this.docCache.clear();

    // Clear pending batch operations
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.batchOperations = [];
  }

  // Retry pending operations (call on app startup)
  async retryPendingOperations() {
    if (typeof window === "undefined" || !window.localStorage) return;

    const pendingOps = JSON.parse(
      localStorage.getItem("pendingOperations") || "[]"
    );
    if (pendingOps.length === 0) return;

    const successfulOps = [];

    for (const op of pendingOps) {
      try {
        if (op.type === "add") {
          const result = await this.addItem(op.collection, op.data);
          if (result.success) {
            successfulOps.push(op);
          }
        }
        // Add other operation types as needed
      } catch (error) {
        console.error("Failed to retry operation:", error);
      }
    }

    // Remove successful operations
    const remainingOps = pendingOps.filter((op) => !successfulOps.includes(op));
    localStorage.setItem("pendingOperations", JSON.stringify(remainingOps));
  }
}

export default new OptimizedFirebaseService();
