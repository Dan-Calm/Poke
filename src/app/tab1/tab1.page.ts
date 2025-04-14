import { Component, OnInit } from '@angular/core';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase.config';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  
  listaDeCartas: {
    nombre: string;
    precioActual: string;
    fechaPrecioActual: string;
    imagen: string;
    link: string;
    tipo_carta: string;
    tienda: string;
    codigo_carta: string;
    coleccion: string;
  }[] = [];

  cartasFiltradas: typeof this.listaDeCartas = [];
  textoBusqueda: string = '';

  constructor() { }

  ngOnInit() {
    this.obtenerCartasDesdeFirebase();
  }

  async obtenerCartasDesdeFirebase() {
    try {
      // Obtener cartas de ambas colecciones
      const [cartasAfkStore, cartasOasisGames] = await Promise.all([
        this.obtenerCartasDeColeccion('productos_afkstore'),
        this.obtenerCartasDeColeccion('productos_oasisgames')
      ]);

      // Combinar ambas listas
      this.listaDeCartas = [...cartasAfkStore, ...cartasOasisGames];
      this.cartasFiltradas = this.listaDeCartas;

      console.log('Cartas obtenidas desde Firebase:', this.listaDeCartas);
    } catch (error) {
      console.error('Error al obtener las cartas desde Firebase:', error);
    }
  }

  // Función genérica para obtener cartas de cualquier colección
  async obtenerCartasDeColeccion(nombreColeccion: string) {
    const referenciaColeccion = collection(db, nombreColeccion);
    const resultadoConsulta = await getDocs(referenciaColeccion);

    return await Promise.all(
      resultadoConsulta.docs.map(async (documento) => {
        const datosCarta = documento.data() as {
          nombre: string;
          imagen: string;
          tipo_carta: string;
          link: string;
          tienda: string;
          codigo_carta: string;
          coleccion: string;
        };

        // Obtener el precio más reciente
        const referenciaPrecios = collection(documento.ref, 'precios');
        const consultaPrecioMasReciente = query(
          referenciaPrecios,
          orderBy('fecha_final', 'desc'),
          limit(1)
        );
        const preciosConsulta = await getDocs(consultaPrecioMasReciente);

        let precioActual = 'No disponible';
        let fechaPrecioActual = 'No disponible';
        if (!preciosConsulta.empty) {
          const precioMasReciente = preciosConsulta.docs[0].data() as {
            precio: number;
            fecha_final: string;
          };

          precioActual = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
          }).format(precioMasReciente.precio);
          fechaPrecioActual = precioMasReciente.fecha_final;
        }

        return {
          nombre: datosCarta.nombre,
          imagen: datosCarta.imagen,
          tipo_carta: datosCarta.tipo_carta,
          link: datosCarta.link,
          tienda: datosCarta.tienda,
          codigo_carta: datosCarta.codigo_carta,
          coleccion: datosCarta.coleccion,
          precioActual,
          fechaPrecioActual,
        };
      })
    );
  }

  filtrarCartas(event: any) {
    const texto = this.textoBusqueda.toLowerCase();
    this.cartasFiltradas = this.listaDeCartas.filter((carta) =>
      carta.nombre.toLowerCase().includes(texto)
    );
  }
}