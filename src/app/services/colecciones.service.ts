import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ColeccionesService {

  idUsuarios: any = ''; // ID del usuario logueado
  favoritos: any[] = []; // guarda los favoritos del usuario logueado
  historial: any[] = []; // guarda los favoritos del usuario logueado
  expansiones: any[] = []; // guarda las expansiones

  colecciones: any[] = []; // guarda las cartas de todas las tiendas

  constructor(private authService: AuthService) { }

  async ngOnInit() {

  }

  async cargarColecciones() {
    try {
      await this.obtenerIdUsuario(); // obtener el id del usuario logueado
      const referenciaFavoritos = collection(db, 'usuarios', this.idUsuarios, 'colecciones');
      console.log('ID del usuario:', this.idUsuarios);
      const resultadoFavoritos = await getDocs(referenciaFavoritos);

      this.colecciones = resultadoFavoritos.docs.map(async (tiendaDoc) => {
        const tiendaId = tiendaDoc.id;
        const referenciaProductos = collection(db, `usuarios/${this.idUsuarios}/colecciones/${tiendaId}/cartas`);
        const resultadoProductos = await getDocs(referenciaProductos);

        // console.log(`Productos de la tienda ${tiendaId}:`, resultadoProductos.docs.map(doc => doc.data()));

        const cartas = resultadoProductos.docs.map((productoDoc) => ({
          id: productoDoc.id,
          tienda: tiendaId,
          ...productoDoc.data(),
        }));

        return cartas;
      });
      console.log('Favoritos encontrados:', resultadoFavoritos.docs.map(doc => doc.id));
      
  
    } catch (error) {
      console.error('Error al cargar los documentos de favoritos:', error);
      throw error;
    }
  }

  async cargarHistorial(): Promise<any[]> {
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    try {
      const referenciaColecciones = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'historial', 'cartas');
      const resultadoColecciones = await getDocs(referenciaColecciones);
      this.favoritos = resultadoColecciones.docs.map(doc => doc.data());

      console.log('Colecciones encontradas:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async cargarFavoritos(): Promise<any[]> {
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    try {
      const referenciaColecciones = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'favoritos', 'cartas');
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
      if (this.idUsuarios) {
        console.log('ID del usuario:', this.idUsuarios);
        return this.idUsuarios;
      } else {
        this.idUsuarios = await this.authService.getCurrentUser();
        return this.idUsuarios;
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
