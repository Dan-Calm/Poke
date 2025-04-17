import { Component, OnInit } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { CartasService } from '../services/cartas.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  cartasPorColeccion: any[] = []; // Almacena las colecciones y sus cartas
  cartasFiltradas: any[] = []; // Almacena las cartas filtradas
  textoBusqueda: string = ''; // Texto ingresado en la barra de búsqueda

  cartas: any[] = []; // Almacena las cartas cargadas

  constructor(private cartasService: CartasService, private router: Router) { }

  async ngOnInit() {
    try {
      // Cargar las cartas de todas las colecciones
      await this.obtenerCartasDeTodasLasColecciones();
      this.cartas = await this.cartasService.cargarCartasDesdeFirebase();

      this.cartasFiltradas = this.cartasPorColeccion; // Inicialmente, mostrar todas las cartas
    } catch (error) {
      console.error('Error durante la inicialización:', error);
    }
  }

  async obtenerCartasDeTodasLasColecciones() {
    try {
      const referenciaColeccion = collection(db, 'colecciones');
      const resultadoConsulta = await getDocs(referenciaColeccion);

      this.cartasPorColeccion = await Promise.all(
        resultadoConsulta.docs.map(async (documento) => {
          const coleccionId = documento.id;
          const referenciaCartas = collection(db, `colecciones/${coleccionId}/cartas`);
          const cartasConsulta = await getDocs(referenciaCartas);

          const cartas = cartasConsulta.docs.map((cartaDoc) => ({
            id: cartaDoc.id,
            ...cartaDoc.data(),
          }));

          return {
            coleccion: coleccionId,
            cartas,
          };
        })
      );

      console.log('Cartas por colección:', this.cartasPorColeccion);
    } catch (error) {
      console.error('Error al obtener las cartas de todas las colecciones:', error);
      throw error;
    }
  }

  accion1(id: string) {
    console.log(`Acción 1 ejecutada para la carta con ID: ${id}`);
  }

  accion2(id: string) {
    console.log(`Acción 2 ejecutada para la carta con ID: ${id}`);
  }

  accion3(id: string) {
    console.log(`Acción 3 ejecutada para la carta con ID: ${id}`);
  }

  // Función para filtrar cartas según el texto ingresado
  filtrarCartas() {
    const texto = this.textoBusqueda.toLowerCase();

    this.cartasFiltradas = this.cartasPorColeccion.map((coleccion) => {
      const cartasFiltradas = coleccion.cartas.filter((carta: any) => {
        return (
          carta.id.toLowerCase().includes(texto) ||
          (carta.nombre_espanol && carta.nombre_espanol.toLowerCase().includes(texto)) ||
          (carta.nombre_ingles && carta.nombre_ingles.toLowerCase().includes(texto)) ||
          (carta.codigo && carta.codigo.toLowerCase().includes(texto))
        );
      });

      return {
        coleccion: coleccion.coleccion,
        cartas: cartasFiltradas,
      };
    }).filter((coleccion) => coleccion.cartas.length > 0); // Eliminar colecciones vacías
  }

  mostrarId(id: string) {
    // Navegar a la segunda pantalla pasando el ID de la colección como parámetro
    this.router.navigate(['/coleccion-detalle', id]);
  }
}