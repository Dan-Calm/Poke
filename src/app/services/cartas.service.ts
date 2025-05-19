import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

@Injectable({
  providedIn: 'root', // Hace que el servicio esté disponible en toda la aplicación
})
export class CartasService {
  private listaExpansiones: any[] = []; // Almacena el listado de cartas
  private listaTiendas: any[] = []; // Almacena el listado de cartas
  private lista_iconos: any[] = []; // Almacena el listado de cartas

  constructor() { }

  async listar_expansiones() {
    const referenciaTiendas = collection(db, 'expansiones');
    const resultadoTiendas = await getDocs(referenciaTiendas);

    const colecciones = resultadoTiendas.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return colecciones;
  }

  async cargar_iconos() {
    const ref = collection(db, 'iconos');
    const querySnapshot = await getDocs(ref);
    const iconos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // console.log('Iconos:', iconos);
    this.lista_iconos = iconos;
    return this.lista_iconos;
  }

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

  async consultarPrecios(id_carta: string, id_tienda: string) {
    console.log('Consultando precios para la carta:', id_carta, 'en la tienda:', id_tienda);
    const precios_ref = collection(db, 'tiendas', id_tienda, 'productos', id_carta, 'precios');
    const precios_doc = await getDocs(precios_ref);
    console.log('Precios encontrados:', precios_doc.docs.map(doc => doc.data()));
    const precios = precios_doc.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Referencia a precios:', precios);
    return precios;
  }

  async expansiones() {
    try {
      // Si ya se han cargado las expansiones, devolverlas directamente
      if (this.listaExpansiones.length > 0) {
        console.log('Usando datos en caché de expansiones:', this.listaExpansiones);
        return this.listaExpansiones;
      }

      // Realizar la consulta a Firebase si los datos no están en caché
      const referenciaColecciones = collection(db, 'expansiones'); // Referencia a la colección "expansiones"
      const resultadoColecciones = await getDocs(referenciaColecciones); // Obtener todas las expansiones

      // Recorrer cada colección y obtener las cartas de su subcolección "cartas"
      const todasLasCartas = await Promise.all(
        resultadoColecciones.docs.map(async (coleccionDoc) => {
          const coleccionId = coleccionDoc.id; // ID de la colección (por ejemplo, "Base_Set_(TCG)")
          const referenciaCartas = collection(db, `expansiones/${coleccionId}/cartas`); // Subcolección "cartas"
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
      this.listaExpansiones = todasLasCartas.reduce((acumulador, cartas) => {
        return acumulador.concat(cartas);
      }, []);

      console.log('Todas las cartas de todas las expansiones:', this.listaExpansiones);
      return this.listaExpansiones;
    } catch (error) {
      console.error('Error al descargar la información de expansiones:', error);
      throw error;
    }
  }
}