import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { db } from '../config/firebase.config';

import { getAuth } from "firebase/auth";
import { e } from '@angular/core/weak_ref.d-DOjz-6fK';


import { updateDoc, Timestamp } from 'firebase/firestore';



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private datosUsuarioCache: any = null;
  private sessionId: string | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private fireStore: AngularFirestore,
  ) { }

  // Método para iniciar sesión con correo y contraseña
  async login(email: string, password: string): Promise<any> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        // Marca como conectado
        await setDoc(doc(db, "usuarios_online", user.uid), {
          email: user.email,
          lastActive: new Date()
        });

        // Inicia sesión de usuario (registro de tiempo)
        const now = new Date();
        const sesionesRef = collection(db, "usuarios", user.uid, "sesiones");
        const sessionDoc = await addDoc(sesionesRef, {
          inicio: now,
          fin: null
        });
        this.sessionId = sessionDoc.id;
        localStorage.setItem('sessionId', this.sessionId);
        console.log('Sesión iniciada con ID:', this.sessionId);
      }
      return user;
    } catch (error) {
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
        await setDoc(doc(db, "usuarios", userId), {
          nombre_usuario: datos.nombre,
          fecha_creacion: new Date(),
          tipo_usuario: "usuario",
          email: email,
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
      const user = await this.afAuth.currentUser;
      if (user) {
        // Elimina de usuarios_online
        await deleteDoc(doc(db, "usuarios_online", user.uid));

        // Finaliza la sesión de usuario (registro de tiempo)
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          const sessionRef = doc(db, "usuarios", user.uid, "sesiones", sessionId);
          await updateDoc(sessionRef, { fin: new Date() });
          localStorage.removeItem('sessionId');
          console.log('Sesión finalizada con ID:', sessionId);
        }
      }
      await this.afAuth.signOut();
    } catch (error) {
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

  getRol(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.afAuth.authState.subscribe(user => {
        if (user) {
          console.log("ID del usuario:", user.uid);
          const userRef = doc(db, "usuarios", user.uid);
          getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              console.log("Datos del usuario:", userData);
              const tipo_usuario = userData['tipo_usuario'];
              resolve(userData['tipo_usuario']); // Devuelve el rol del usuario
            } else {
              console.log("No se encontró el documento del usuario");
              resolve(null);
            }
          })
        } else {
          resolve(null); // No hay usuario autenticado
        }
      }, error => {
        reject(error); // Maneja errores
      });
    });
  }

  upgradeToPremium(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getCurrentUser().then(userId => {
        if (userId) {
          const userRef = doc(db, "usuarios", userId);
          updateDoc(userRef, { tipo_usuario: "premium" })
            .then(() => {
              console.log("Usuario actualizado a premium");
              resolve();
            })
            .catch(error => {
              console.error("Error al actualizar el usuario a premium:", error);
              reject(error);
            });
        } else {
          reject(new Error("No hay usuario autenticado"));
        }
      }).catch(error => reject(error));
    });
  }

  async getDatosUsuario(): Promise<any> {
    // Si ya tenemos los datos en caché, los devolvemos
    if (this.datosUsuarioCache) {
      return this.datosUsuarioCache;
    }

    // Si no, los obtenemos desde Firebase
    return new Promise((resolve, reject) => {
      this.afAuth.authState.subscribe(user => {
        if (user) {
          const userRef = doc(db, "usuarios", user.uid);
          getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              this.datosUsuarioCache = userData; // Guardamos en caché
              resolve(userData);
            } else {
              resolve(null);
            }
          }).catch(error => reject(error));
        } else {
          resolve(null);
        }
      }, error => reject(error));
    });
  }

  // Por si en algún momento el usuario edita sus datos y quieres forzar una recarga
  limpiarCacheUsuario() {
    this.datosUsuarioCache = null;
  }
}