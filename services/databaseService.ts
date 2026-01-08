import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { Book } from '../types';

export const databaseService = {
  async saveBook(userId: string, book: Book): Promise<void> {
    const bookRef = doc(db, 'users', userId, 'books', book.id);
    // Convert Dates to ISO strings for Firestore if necessary, 
    // though Firestore handles timestamps well. We'll use ISO for consistency with our types.
    const data = {
      ...book,
      createdAt: book.createdAt.toISOString()
    };
    await setDoc(bookRef, data);
  },

  async updateBook(userId: string, bookId: string, updates: Partial<Book>): Promise<void> {
    const bookRef = doc(db, 'users', userId, 'books', bookId);
    const data = { ...updates };
    if (data.createdAt instanceof Date) {
        data.createdAt = (data.createdAt as Date).toISOString() as any;
    }
    await updateDoc(bookRef, data);
  },

  async getBooks(userId: string): Promise<Book[]> {
    const booksCol = collection(db, 'users', userId, 'books');
    const q = query(booksCol);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: new Date(data.createdAt)
      } as Book;
    });
  },

  async deleteBook(userId: string, bookId: string): Promise<void> {
    const bookRef = doc(db, 'users', userId, 'books', bookId);
    await deleteDoc(bookRef);
  }
};
