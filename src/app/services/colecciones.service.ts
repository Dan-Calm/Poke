import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ColeccionesService {

  idUsiuario: any = ''; // ID del usuario logueado
  favoritos: any[] = []; // guarda los favoritos del usuario logueado
  historial: any[] = []; // guarda los favoritos del usuario logueado
  expansiones: any[] = []; // guarda las expansiones


  constructor(private authService: AuthService) { }

  async ngOnInit() {

  }

  async cargarHistorial(id: string): Promise<any[]> {
    try {
      const referenciaColecciones = collection(db, 'usuarios', id, 'historial');
      const resultadoColecciones = await getDocs(referenciaColecciones);
      this.favoritos = resultadoColecciones.docs.map(doc => doc.data());

      console.log('Colecciones encontradas:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async cargarFavoritos(id: string): Promise<any[]> {
    try {
      const referenciaColecciones = collection(db, 'usuarios', id, 'favoritos');
      const resultadoColecciones = await getDocs(referenciaColecciones);
      this.favoritos = resultadoColecciones.docs.map(doc => doc.data());

      console.log('Colecciones encontradas:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async obtenerIdUsuario() {
    try {
      this.idUsiuario = await this.authService.getCurrentUser();
      if (this.idUsiuario) {
        console.log('ID del usuario:', this.idUsiuario);
      } else {
        console.log('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('Error al obtener el ID del usuario:', error);
    }
   }

   async cargarExpansiones(): Promise<any[]> {
    try {
      const referenciaExpansiones = collection(db, 'expansiones');
      const resultado = await getDocs(referenciaExpansiones);
      this.expansiones = resultado.docs.map(doc => doc.data());
  
      console.log('Expansiones encontradas:', this.expansiones);
      return this.expansiones;
    } catch (error) {
      console.error('Error al cargar las expansiones:', error);
      throw error;
    } 
  }

  async cargarColeccionesCompletas(): Promise<any[]> {
    try {
      await this.obtenerIdUsuario();
  
      const favoritos = await this.cargarFavoritos(this.idUsiuario);
      const expansiones = await this.cargarExpansiones();
  
      const listaUnificada = [
        { tipo: 'Favoritos', items: favoritos },
        { tipo: 'Expansiones', items: expansiones }
      ];
  
      return listaUnificada;
    } catch (error) {
      console.error('Error al cargar las colecciones completas:', error);
      return [];
    }
  }
}
