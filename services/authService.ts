import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';

export const authService = {
  loginWithGoogle: async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        id: user.uid,
        name: user.displayName || 'Author',
        email: user.email || '',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
      };
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      throw new Error(error.message || "Failed to sign in with Google");
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
        unsubscribe();
        if (user) {
          resolve({
            id: user.uid,
            name: user.displayName || 'Author',
            email: user.email || '',
            avatar: user.photoURL || ''
          });
        } else {
          resolve(null);
        }
      });
    });
  }
};
