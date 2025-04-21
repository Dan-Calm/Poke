import { Component, OnInit } from '@angular/core';
import { CartasService } from '../services/cartas.service';
import { Router } from '@angular/router';

import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

import { InfiniteScrollCustomEvent } from '@ionic/angular';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,

})
export class Tab1Page implements OnInit {
  cartasPorColeccion: any[] = []; // guarda las cartas de la wikidex
  cartasFiltradas: any[] = []; // listra con las cartas filtradas por la barra de busqqueda
  cartasMostradas: any[] = []; // cartas que se mostrarán en la pantalla

  cartasTienda: any[] = []; // guarda las cartas de todas las tiendas

  textoBusqueda: string = ''; // Texto ingresado en la barra de búsqueda

  idUsiuario: any = ''; // ID del usuario logueado

  constructor(private cartasService: CartasService, private router: Router, private authService: AuthService) { }

  async ngOnInit() {
    this.iniciarColecciones(); // cargar las colecciones al iniciar
    this.cartasService.descargarCartasDeTiendas();
    this.obtenerIdUsuario(); // obtener el id del usuario logueado
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


  onIonInfinite(event: InfiniteScrollCustomEvent) {
    alert('Scroll infinito activado');
    console.log('FINAL');
    event.target.complete();
  }

  async iniciarColecciones() {
    try {
      // llenar cartasPorColeccion con las cartas de la wikidex
      this.cartasPorColeccion = await this.cartasService.colecciones();
      //filtro en blanco
      this.cartasFiltradas = this.cartasPorColeccion;
      // cargar las primeras 12 cartas
      this.cartasMostradas = this.cartasFiltradas.slice(0, 12);

      console.log('Lista única de cartas:', this.cartasPorColeccion);

      console.log('Cartas cargadas:', this.cartasMostradas);
    } catch (error) {
      console.error('Error durante la inicialización:', error);
    }
  }

  onMenuOpen() {
    document.getElementById('main-content')?.setAttribute('inert', 'true');
  }

  onMenuClose() {
    document.getElementById('main-content')?.removeAttribute('inert');
  }

  async agregarFavorito(id: string) {
    console.log(`Acción 1 ejecutada para la carta con ID: ${id}`);
    const usuario = doc(db, 'usuarios', this.idUsiuario);

    await setDoc(doc(db, "usuarios", this.idUsiuario, "favoritos", id), {
    });
    console.log('Favorito agregado:', id);
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

    // filtrar por nombre y codigo
    this.cartasFiltradas = this.cartasPorColeccion.filter((carta: any) => {
      return (
        carta.id.toLowerCase().includes(texto) ||
        (carta.nombre_espanol && carta.nombre_espanol.toLowerCase().includes(texto)) ||
        (carta.nombre_ingles && carta.nombre_ingles.toLowerCase().includes(texto)) ||
        (carta.codigo && carta.codigo.toLowerCase().includes(texto))
      );
    });

    // Actualizar cartasMostradas con los primeros 12 elementos de cartasFiltradas
    this.cartasMostradas = this.cartasFiltradas.slice(0, 12);

    console.log('Cartas filtradas:', this.cartasFiltradas);
    console.log('Cartas cargadas:', this.cartasMostradas);
  }

  mostrarId(id: string) {
    // Navegar a la segunda pantalla pasando el ID de la colección como parámetro
    this.router.navigate(['/coleccion-detalle', id]);
  }

  onScrollEnd() {
    console.log('Se ha llegado al final de la página.');

    // se calcula el largo actual de cartasMostradas
    this.cartasMostradas = this.cartasFiltradas.slice(0, this.cartasMostradas.length + 12);

    console.log('Cartas cargadas:', this.cartasMostradas);
  }

}