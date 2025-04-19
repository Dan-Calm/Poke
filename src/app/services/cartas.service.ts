import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
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
      const referenciaTiendas = collection(db, 'tiendas'); // Referencia a la colección "tiendas"
      const resultadoTiendas = await getDocs(referenciaTiendas); // Obtener todas las tiendas

      // Recorrer cada tienda y obtener las cartas de su subcolección "productos"
      const todasLasCartas = await Promise.all(
        resultadoTiendas.docs.map(async (tiendaDoc) => {
          const tiendaId = tiendaDoc.id; // ID de la tienda (por ejemplo, "afkstore" o "oasisgames")
          const referenciaProductos = collection(db, `tiendas/${tiendaId}/productos`); // Subcolección "productos"
          const resultadoProductos = await getDocs(referenciaProductos); // Obtener los productos de la tienda

          // Agregar el nombre de la tienda a cada carta
          const cartas = resultadoProductos.docs.map((productoDoc) => ({
            id: productoDoc.id,
            tienda: tiendaId, // Agregar el nombre de la tienda
            ...productoDoc.data(),
          }));

          return cartas; // Retornar las cartas de esta tienda
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

      // console.log('Todas las cartas combinadas:', this.listaColecciones);
      return this.listaColecciones;
    } catch (error) {
      console.error('Error al descargar la información de colecciones:', error);
      throw error;
    }
  }
}