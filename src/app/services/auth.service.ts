import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth) {}

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
  async register(email: string, password: string): Promise<any> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      console.log('Usuario registrado:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // Método para obtener el usuario actual
  getCurrentUser() {
    return this.afAuth.authState;
  }
}