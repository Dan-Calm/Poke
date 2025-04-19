import { Component, OnInit } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { CartasService } from '../services/cartas.service';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent } from '@ionic/angular';


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  cartasPorColeccion: any[] = []; // Almacena las colecciones y sus cartas
  cartasTienda: any[] = []; // Almacena las colecciones y sus cartas

  cartasFiltradas: any[] = []; // Almacena las cartas filtradas
  cartasCargadas: any[] = []; // Almacena las cartas filtradas
  textoBusqueda: string = ''; // Texto ingresado en la barra de búsqueda

  cartas: any[] = []; // Almacena las cartas cargadas

  constructor(private cartasService: CartasService, private router: Router) { }

  async ngOnInit() {
    try {
      // Cargar las cartas de las colecciones
      const cartasDeColecciones = await this.cartasService.colecciones();

      // Asignar solo las cartas de las colecciones
      this.cartas = cartasDeColecciones;

      // Inicializar las cartas filtradas con las cartas de las colecciones
      this.cartasFiltradas = this.cartas;
      // Actualizar cartasCargadas con los primeros 12 elementos de cartasFiltradas
      this.cartasCargadas = this.cartasFiltradas.slice(0, 18);

      console.log('Cartas de las colecciones:', this.cartas);
    } catch (error) {
      console.error('Error durante la inicialización:', error);
    }
  }

  async iniciarColecciones() {
    try {
      // Llamar a la función del servicio para obtener la lista única de cartas
      this.cartas = await this.cartasService.colecciones();

      console.log('Lista única de cartas:', this.cartas);

      // Puedes usar `this.cartas` para filtrar, mostrar o procesar las cartas
      // this.cartasFiltradas = this.cartas.slice(0, 18); // Ejemplo: Mostrar las primeras 10 cartas
      console.log('Cartas cargadas:', this.cartasFiltradas);
    } catch (error) {
      console.error('Error durante la inicialización:', error);
    }
  }

  async iniciarTiendas() {
    try {
      // Llamar a la función del servicio para obtener todas las cartas de las tiendas
      this.cartasTienda = await this.cartasService.descargarCartasDeTiendas();

      console.log('Cartas de todas las tiendas:', this.cartasTienda);

      // Puedes usar `this.cartasTienda` para filtrar, mostrar o procesar las cartas
    } catch (error) {
      console.error('Error al cargar las cartas de las tiendas:', error);
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

    // Filtrar las cartas según el texto ingresado
    this.cartasFiltradas = this.cartas.filter((carta: any) => {
      return (
        carta.id.toLowerCase().includes(texto) ||
        (carta.nombre_espanol && carta.nombre_espanol.toLowerCase().includes(texto)) ||
        (carta.nombre_ingles && carta.nombre_ingles.toLowerCase().includes(texto)) ||
        (carta.codigo && carta.codigo.toLowerCase().includes(texto))
      );
    });

    // Actualizar cartasCargadas con los primeros 12 elementos de cartasFiltradas
    this.cartasCargadas = this.cartasFiltradas.slice(0, 18);

    console.log('Cartas filtradas:', this.cartasFiltradas);
    console.log('Cartas cargadas:', this.cartasCargadas);
  }

  mostrarId(id: string) {
    // Navegar a la segunda pantalla pasando el ID de la colección como parámetro
    this.router.navigate(['/coleccion-detalle', id]);
  }

  onScrollEnd() {
    console.log('Se ha llegado al final de la página.');

    // Calcular el índice actual y el nuevo límite
    const inicio = this.cartasCargadas.length;
    const fin = inicio + 12;

    // Agregar las siguientes 12 cartas a cartasCargadas
    const nuevasCartas = this.cartasFiltradas.slice(inicio, fin);
    this.cartasCargadas = [...this.cartasCargadas, ...nuevasCartas];

    console.log('Cartas cargadas:', this.cartasCargadas);


  }

}