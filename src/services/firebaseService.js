// src/services/firebaseService.js
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, appId, Timestamp } from "../firebase";

/**
 * Firebase service for handling all database operations
 */
class FirebaseService {
  constructor() {
    this.collections = {
      sellItems: `artifacts/${appId}/public/data/sell_items`,
      lostFoundItems: `artifacts/${appId}/public/data/lostfound_items`,
      users: `artifacts/${appId}/users`,
    };
  }

  // Generic methods
  getCollection(collectionPath) {
    return collection(db, collectionPath);
  }

  // Real-time listeners
  subscribeToItems(collectionPath, callback, filters = {}) {
    let q = query(this.getCollection(collectionPath));

    // Apply filters
    if (filters.userId) {
      q = query(q, where("userId", "==", filters.userId));
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    // Default ordering by creation date
    q = query(q, orderBy("createdAt", "desc"));

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    return onSnapshot(q, callback);
  }

  // CRUD operations for items
  async createItem(collectionPath, itemData) {
    try {
      const docRef = await addDoc(this.getCollection(collectionPath), {
        ...itemData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating item:", error);
      return { success: false, error: error.message };
    }
  }

  async updateItem(collectionPath, itemId, itemData) {
    try {
      await setDoc(
        doc(db, collectionPath, itemId),
        {
          ...itemData,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating item:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteItem(collectionPath, itemId) {
    try {
      await deleteDoc(doc(db, collectionPath, itemId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting item:", error);
      return { success: false, error: error.message };
    }
  }

  // Image operations
  async uploadImage(file, path) {
    try {
      const imageName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const storagePath = `images/${appId}/${path}/${imageName}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { success: true, url: downloadURL, path: storagePath };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting image:", error);
      return { success: false, error: error.message };
    }
  }

  async uploadMultipleImages(files, path) {
    const uploadPromises = files.map((file) => this.uploadImage(file, path));
    const results = await Promise.allSettled(uploadPromises);

    const successful = results
      .filter((result) => result.status === "fulfilled" && result.value.success)
      .map((result) => result.value);

    const failed = results
      .filter((result) => result.status === "rejected" || !result.value.success)
      .map((result) => result.reason || result.value?.error);

    return { successful, failed };
  }

  // Specific methods for different collections
  subscribeToSellItems(callback, filters = {}) {
    return this.subscribeToItems(this.collections.sellItems, callback, filters);
  }

  subscribeToLostFoundItems(callback, filters = {}) {
    return this.subscribeToItems(
      this.collections.lostFoundItems,
      callback,
      filters
    );
  }

  subscribeToUserItems(userId, callback) {
    return this.subscribeToSellItems(callback, { userId });
  }

  createSellItem(itemData) {
    return this.createItem(this.collections.sellItems, itemData);
  }

  createLostFoundItem(itemData) {
    return this.createItem(this.collections.lostFoundItems, itemData);
  }

  updateSellItem(itemId, itemData) {
    return this.updateItem(this.collections.sellItems, itemId, itemData);
  }

  updateLostFoundItem(itemId, itemData) {
    return this.updateItem(this.collections.lostFoundItems, itemId, itemData);
  }

  deleteSellItem(itemId) {
    return this.deleteItem(this.collections.sellItems, itemId);
  }

  deleteLostFoundItem(itemId) {
    return this.deleteItem(this.collections.lostFoundItems, itemId);
  }

  // Pagination support
  async getItemsPaginated(
    collectionPath,
    lastDoc = null,
    pageSize = 20,
    filters = {}
  ) {
    try {
      let q = query(this.getCollection(collectionPath));

      // Apply filters
      if (filters.userId) {
        q = query(q, where("userId", "==", filters.userId));
      }

      // Order and pagination
      q = query(q, orderBy("createdAt", "desc"), limit(pageSize));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.docs.length === pageSize;

      return {
        success: true,
        items,
        lastVisible,
        hasMore,
      };
    } catch (error) {
      console.error("Error fetching paginated items:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new FirebaseService();
