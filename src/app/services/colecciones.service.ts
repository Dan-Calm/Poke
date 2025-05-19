import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
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
      console.log('ID del usuario DE LAS COLECCIONES:', this.idUsuarios);
      console.log('Referencia de colecciones ESTE SI:', referenciaFavoritos);
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

      console.log('HISTORIAL ENCONTRADO:', this.favoritos);
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

      console.log('FAVORITOS ENCONTRADOS:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async listaFavoritos(): Promise<any[]> {
    if (this.favoritos.length > 0) {
      return this.favoritos;
    }else {
      return await this.cargarFavoritos();
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
  
      const favoritos = await this.cargarFavoritos();
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

  async completarColeccion(id: string, lista: any[]) {
    await this.obtenerIdUsuario();
    console.log('ID del usuario:', this.idUsuarios);
    console.log('ID de la tienda:', id);
    console.log('Lista de cartas:', lista);

    for (const carta of lista) {
        console.log("Procesando carta:", carta);
        console.log("ID de la carta:", carta.id);

        try {
            await setDoc(doc(db, "usuarios", this.idUsuarios, "colecciones", id, "cartas", carta.id), {
                id: carta.id,
                nombre: carta.nombre_espanol,
                rareza: carta.rareza,
                imagen: carta.imagen_url,
                colecciones: "informacion extra"
            });
            console.log(`Documento de la carta ${carta.id} escrito correctamente`);
        } catch (error) {
            console.error(`Error al escribir el documento de la carta ${carta.id}:`, error);
        }
    }
}

  async eliminarCartaFavorita(id: string): Promise<any[]> {
    const idUsuario = await this.obtenerIdUsuario();
    await deleteDoc(doc(db, 'usuarios', idUsuario, 'colecciones', 'favoritos', 'cartas', id));
    console.log('Carta eliminada:', id);
    return this.cargarFavoritos(); // Retorna la lista actualizada
  }

  async cargarCartasDeColeccion(nombreColeccion: string): Promise<any[]> {
  await this.obtenerIdUsuario();
  const ref = collection(db, 'usuarios', this.idUsuarios, 'colecciones', nombreColeccion, 'cartas');
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => doc.data());
}
}
