// Importar las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Para usar Firestore
import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase (reemplaza con tu configuración si es necesario)
const firebaseConfig = {
  apiKey: "AIzaSyD321rOnXxMr28Rq0UOSXudhX00slbw9bc",
  authDomain: "pokecentro-9340e.firebaseapp.com",
  projectId: "pokecentro-9340e",
  storageBucket: "pokecentro-9340e.appspot.com", // Corregido
  messagingSenderId: "88426326429",
  appId: "1:88426326429:web:37007c5321dceaccf0a774",
  measurementId: "G-8HZYMPLCLQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Analytics (opcional)
export const analytics = getAnalytics(app);