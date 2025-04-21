import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc, setDoc} from 'firebase/firestore';
import { db } from '../config/firebase.config';


@Injectable({
  providedIn: 'root', // Hace que el servicio esté disponible en toda la aplicación
})
export class CartasService {
  private listaColecciones: any[] = []; // Almacena el listado de cartas
  private listaTiendas: any[] = []; // Almacena el listado de cartas

  constructor() { }

  async descargarCartasDeTiendas() {
    try {
      const referenciaTiendas = collection(db, 'tiendas');
      const resultadoTiendas = await getDocs(referenciaTiendas);
  
      console.log('Tiendas encontradas:', resultadoTiendas.docs.map(doc => doc.id));
  
      if (resultadoTiendas.empty) {
        console.warn('La colección "tiendas" está vacía.');
        return [];
      }
  
      const todasLasCartas = await Promise.all(
        resultadoTiendas.docs.map(async (tiendaDoc) => {
          const tiendaId = tiendaDoc.id;
          const referenciaProductos = collection(db, `tiendas/${tiendaId}/productos`);
          const resultadoProductos = await getDocs(referenciaProductos);
  
          // console.log(`Productos de la tienda ${tiendaId}:`, resultadoProductos.docs.map(doc => doc.data()));
  
          const cartas = resultadoProductos.docs.map((productoDoc) => ({
            id: productoDoc.id,
            tienda: tiendaId,
            ...productoDoc.data(),
          }));
  
          return cartas;
        })
      );

      // Combinar todas las cartas en una sola lista
      this.listaTiendas = todasLasCartas.reduce((acumulador, cartas) => {
        return acumulador.concat(cartas);
      }, []);

      console.log('Todas las cartas de todas las tiendas:', this.listaTiendas);

      return this.listaTiendas;
    } catch (error) {
      console.error('Error al descargar las cartas de las tiendas:', error);
      throw error;
    }
  }

  async colecciones() {
    try {
      // Si ya se han cargado las colecciones, devolverlas directamente
      if (this.listaColecciones.length > 0) {
        console.log('Usando datos en caché de colecciones:', this.listaColecciones);
        return this.listaColecciones;
      }

      // Realizar la consulta a Firebase si los datos no están en caché
      const referenciaColecciones = collection(db, 'colecciones'); // Referencia a la colección "colecciones"
      const resultadoColecciones = await getDocs(referenciaColecciones); // Obtener todas las colecciones

      // Recorrer cada colección y obtener las cartas de su subcolección "cartas"
      const todasLasCartas = await Promise.all(
        resultadoColecciones.docs.map(async (coleccionDoc) => {
          const coleccionId = coleccionDoc.id; // ID de la colección (por ejemplo, "Base_Set_(TCG)")
          const referenciaCartas = collection(db, `colecciones/${coleccionId}/cartas`); // Subcolección "cartas"
          const resultadoCartas = await getDocs(referenciaCartas); // Obtener las cartas de la colección

          // Agregar el nombre de la colección a cada carta
          const cartas = resultadoCartas.docs.map((cartaDoc) => ({
            id: cartaDoc.id,
            coleccion: coleccionId, // Agregar el nombre de la colección
            ...cartaDoc.data(),
          }));

          return cartas; // Retornar las cartas de esta colección
        })
      );

      // Combinar todas las cartas en una sola lista
      this.listaColecciones = todasLasCartas.reduce((acumulador, cartas) => {
        return acumulador.concat(cartas);
      }, []);

      console.log('Todas las cartas de todas las colecciones:', this.listaColecciones);
      return this.listaColecciones;
    } catch (error) {
      console.error('Error al descargar la información de colecciones:', error);
      throw error;
    }
  }
}