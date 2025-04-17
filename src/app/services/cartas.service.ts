import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

@Injectable({
  providedIn: 'root', // Hace que el servicio esté disponible en toda la aplicación
})
export class CartasService {
  private cartas: any[] = []; // Almacena el listado de cartas
  private cartasCargadas: boolean = false; // Indica si las cartas ya fueron cargadas

  constructor() {}

  // Función para cargar las cartas desde Firebase
  async cargarCartasDesdeFirebase() {
    if (this.cartasCargadas) {
      // Si ya se cargaron las cartas, no volver a cargarlas
      return this.cartas;
    }

    try {
      const referenciaTiendas = collection(db, 'tiendas'); // Referencia a la colección "tiendas"
      const resultadoTiendas = await getDocs(referenciaTiendas); // Obtener todas las tiendas

      const cartasCargadas: any[] = [];

      // Recorrer cada tienda y obtener sus productos
      for (const tiendaDoc of resultadoTiendas.docs) {
        const tiendaId = tiendaDoc.id; // ID de la tienda (por ejemplo, "productos_afkstore" o "productos_oasisgames")
        const referenciaProductos = collection(db, `tiendas/${tiendaId}/productos`); // Subcolección "productos"
        const resultadoProductos = await getDocs(referenciaProductos); // Obtener los productos de la tienda

        const productosDeTienda = resultadoProductos.docs.map((productoDoc) => ({
          id: productoDoc.id,
          tienda: tiendaId, // Agregar el ID de la tienda al producto
          ...productoDoc.data(),
        }));

        cartasCargadas.push(...productosDeTienda); // Agregar los productos al listado general
      }

      this.cartas = cartasCargadas;
      this.cartasCargadas = true; // Marcar como cargadas
      console.log('Cartas cargadas desde Firebase:', this.cartas);
      return this.cartas;
    } catch (error) {
      console.error('Error al cargar las cartas desde Firebase:', error);
      throw error;
    }
  }

  // Función para obtener las cartas
  obtenerCartas() {
    return this.cartas;
  }
}