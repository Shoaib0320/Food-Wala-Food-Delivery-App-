import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup ,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithRedirect, getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import {
  getFirestore,
  collection,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3hrvhnZX4puogx1mad8ri1LXnFA6jhTM",
  authDomain: "food-wala-food-delivery-app.firebaseapp.com",
  projectId: "food-wala-food-delivery-app",
  storageBucket: "food-wala-food-delivery-app.appspot.com",
  messagingSenderId: "295273858722",
  appId: "1:295273858722:web:eb069d8c1484a902e839fb",
  measurementId: "G-L8Z5Z35LR5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
  auth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider, 
  signInWithPopup ,
  signInWithRedirect, getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber ,
  setDoc,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  uploadBytes,
};