import { Component, OnInit } from '@angular/core';
import { CartasService } from '../services/cartas.service';
import { ColeccionesService } from '../services/colecciones.service';
import { Router } from '@angular/router';

import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

import { InfiniteScrollCustomEvent } from '@ionic/angular';

import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,

})
export class Tab1Page implements OnInit {
  cartas_expansiones: any[] = []; // guarda las cartas de la wikidex
  cartas_filtradas: any[] = []; // listra con las cartas filtradas por la barra de busqqueda
  cartas_mostradas: any[] = []; // cartas que se mostrarán en la pantalla

  cartasTienda: any[] = []; // guarda las cartas de todas las tiendas
  favoritos: any[] = []; // guarda las cartas de todas las tiendas
  historial: any[] = []; // guarda las cartas de todas las tiendas

  textoBusqueda: string = ''; // Texto ingresado en la barra de búsqueda

  idUsiuario: any = ''; // ID del usuario logueado

  mostrarModal = false; // Controla la visibilidad del modal
  imagen_carta_seleccionada: string = ''; // Almacena la URL de la imagen seleccionada
  nombre_carta_seleccionada: string = ''; // 
  codigo_carta_seleccionada: string = ''; // 
  rareza_carta_seleccionada: string = ''; // 
  tipo_carta_seleccionada: string = ''; // 
  expansion_carta_seleccionada: string = ''; // 


  constructor(
    private cartasService: CartasService,
    private router: Router,
    private authService: AuthService,
    private coleccionesServies: ColeccionesService,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.iniciarColecciones(); // cargar las colecciones al iniciar
    this.cartasTienda = await this.cartasService.descargarCartasDeTiendas();
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    this.favoritos = await this.coleccionesServies.cargarFavoritos(); // cargar los favoritos del usuario logueado
    this.historial = await this.coleccionesServies.cargarHistorial(); // cargar los historial del usuario logueado
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
    // Verificar si ya se están mostrando todas las cartas filtradas
    if (this.cartas_mostradas.length >= this.cartas_filtradas.length) {
      console.log('No hay más cartas para cargar.');
      event.target.complete();
      return;
    }
    // Cargar más cartas
    this.cartas_mostradas = this.cartas_filtradas.slice(0, this.cartas_mostradas.length + 12);

    console.log('Cartas cargadas:', this.cartas_mostradas);
    event.target.complete();
  }

  irAFavoritos(id: string) {
    this.router.navigate(['/coleccion-detalle', id]);
  }

  async iniciarColecciones() {
    try {
      // llenar cartas_expansiones con las cartas de la wikidex
      this.cartas_expansiones = await this.cartasService.expansiones();
      //filtro en blanco
      this.cartas_filtradas = this.cartas_expansiones;
      // cargar las primeras 12 cartas
      this.cartas_mostradas = this.cartas_filtradas.slice(0, 12);

      console.log('Lista única de cartas:', this.cartas_expansiones);

      console.log('Cartas cargadas:', this.cartas_mostradas);
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

  async agregarFavorito(id: string, nombre: string, codigo: string, imagen: string) {
    console.log(`Agregar a Favorito carta con ID: ${id}`);
    const usuario = doc(db, 'usuarios', this.idUsiuario);

    await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos", "cartas", id), {
      nombre: nombre,
      codigo: codigo,
      id: id,
      imagen: imagen,
    });
    console.log('Favorito agregado:', id);
    this.favoritos = await this.coleccionesServies.cargarFavoritos(); // cargar los favoritos del usuario logueado
  }

  async eliminarFavorito(id: string) {
    console.log("eliminar favorito", id);

    await deleteDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos", "cartas", id));
    this.favoritos = await this.coleccionesServies.cargarFavoritos(); // cargar los favoritos del usuario logueado
  }

  async agregarPropia(id: string, nombre: string, codigo: string) {
    console.log(`Acción 2 ejecutada para la carta con ID: ${id}`);

    console.log("Cartas de la tienda", this.cartasTienda);

    const cartasConPrecio = this.cartasTienda.filter((carta) => carta.coleccion === id);
    console.log(`Cartas filtradas por la colección "${id}":`, cartasConPrecio);

    const sumaPrecios = cartasConPrecio.reduce((acumulador: number, carta: any) => { return acumulador + carta.precio; }, 0);

    const precioPromedio = sumaPrecios / cartasConPrecio.length;
    console.log(`Suma de precios de todas las cartas: ${precioPromedio}`);

    // Crear y mostrar la alerta
    const alert = await this.alertController.create({
      header: 'Agregar a tu colección',
      inputs: [
        {
          name: 'precioPromedio',
          type: 'number',
          placeholder: `Precio promedio: ${precioPromedio.toString()}`,
        },
        {
          name: 'cantidad',
          type: 'number',
          placeholder: `Unidades`,
          min: 1,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Acción cancelada');
          },
        },
        {
          text: 'Guardar',
          handler: (data) => {
            // Validar que la cantidad sea al menos 1
            const cantidad = parseInt(data.cantidad, 10);
            if (!cantidad || cantidad < 1) {
              console.error('La cantidad debe ser al menos 1.');
              alert.dismiss(); // Cerrar la alerta si el valor no es válido
              return false; // Evitar que se ejecute el resto del handler
            }

            // Validar el precio promedio
            const precioFinal = data.precioPromedio ? parseFloat(data.precioPromedio) : precioPromedio;

            console.log(`Precio final guardado: ${precioFinal}`);
            console.log(`Cantidad guardada: ${cantidad}`);

            // Guardar los datos en Firestore
            setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "propias", "cartas", id), {
              nombre: nombre,
              codigo: codigo,
              id: id,
              precio: precioFinal,
              cantidad: cantidad,
            });

            return true; // Indicar que el handler se ejecutó correctamente
          },
        },
      ],
    });



    await alert.present();

  }

  accion3(id: string) {
    console.log(`Acción 3 ejecutada para la carta con ID: ${id}`);
  }

  // Función para abrir el modal con la imagen seleccionada
  verCarta(carta: any): void {
    this.imagen_carta_seleccionada = carta.imagen_url_grande;
    this.nombre_carta_seleccionada = carta.nombre_espanol;
    this.codigo_carta_seleccionada = carta.codigo;
    this.rareza_carta_seleccionada = carta.rareza;
    this.tipo_carta_seleccionada = carta.tipo_carta;
    this.expansion_carta_seleccionada = carta.expansion;

    this.mostrarModal = true; // Mostrar el modal
  }

  // Función para cerrar el modal
  cerrarModal(): void {
    this.mostrarModal = false; // Ocultar el modal
  }

  // Función para filtrar cartas según el texto ingresado
  filtrarCartas() {
    const texto = this.textoBusqueda.toLowerCase();

    // filtrar por nombre y codigo
    this.cartas_filtradas = this.cartas_expansiones.filter((carta: any) => {
      return (
        carta.id.toLowerCase().includes(texto) ||
        (carta.nombre_espanol && carta.nombre_espanol.toLowerCase().includes(texto)) ||
        (carta.nombre_ingles && carta.nombre_ingles.toLowerCase().includes(texto)) ||
        (carta.codigo && carta.codigo.toLowerCase().includes(texto))
      );
    });

    // Actualizar cartas_mostradas con los primeros 12 elementos de cartas_filtradas
    this.cartas_mostradas = this.cartas_filtradas.slice(0, 12);

    console.log('Cartas filtradas:', this.cartas_filtradas);
    console.log('Cartas cargadas:', this.cartas_mostradas);
  }

  async cotizar(id: string, nombre: string, codigo: string) {
    console.log("ID del usuario:", this.idUsiuario);

    console.log(`Cotizar carta con ID: ${id}`);

    await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "historial", "cartas", id), {
      nombre: nombre,
      codigo: codigo,
      id: id,
    });

    console.log('Historial agregado:', id);
    this.historial = await this.coleccionesServies.cargarHistorial(); // cargar los favoritos del usuario logueado
    // Navegar a la segunda pantalla pasando el ID de la colección como parámetro
    this.router.navigate(['/coleccion-detalle', id]);
  }

  accionMantenerPresionada(id: string, nombre: string, codigo: string): void {
    console.log('Imagen mantenida presionada');
    console.log('ID:', id);
    console.log('Nombre:', nombre);
    console.log('Código:', codigo);

    // Aquí puedes ejecutar la acción que desees
    alert(`Has mantenido presionada la carta: ${nombre} (${codigo})`);
  }


}