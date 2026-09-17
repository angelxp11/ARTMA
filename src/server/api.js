import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBSy0z8HrX1-audgduYLlVf3TYmJzF2Gj4',
  authDomain: 'muebles-62262.firebaseapp.com',
  projectId: 'muebles-62262',
  storageBucket: 'muebles-62262.firebasestorage.app',
  messagingSenderId: '206501992657',
  appId: '1:206501992657:web:58f83518ff1f79ed970df0',
  measurementId: 'G-RDS5KD2HGD',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;