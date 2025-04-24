import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { db } from '../config/firebase.config';

import { getAuth } from "firebase/auth";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private fireStore: AngularFirestore) { }

  // Método para iniciar sesión con correo y contraseña
  async login(email: string, password: string): Promise<any> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('Usuario autenticado:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error en el login:', error);
      throw error;
    }
  }

  // Método para registrar un nuevo usuario
  async register(email: string, password: string, datos: any): Promise<any> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user?.uid;

      console.log("Datos del usuario:", datos);
      console.log("ID del usuario:", userId);

      if (userId) {
        await setDoc(doc(db, "usuarios", datos.nombre), {
          nombreUsuario: datos.userId,
          fechaCreacion: new Date(),
        });
        console.log('Usuario registrado:', userCredential);
      };


      return userCredential.user;
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  }

  // Método para cerrar sesión
  async cerrarSesion(): Promise<void> {
    try {
      await this.afAuth.signOut();
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // Método para obtener el usuario actual
getCurrentUser(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        resolve(user.uid); // Devuelve el ID del usuario
      } else {
        resolve(null); // No hay usuario autenticado
      }
    }, error => {
      reject(error); // Maneja errores
    });
  });
}
}