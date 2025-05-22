import { Component, NgModule, OnInit } from '@angular/core';
import { CartasService } from '../services/cartas.service';
import { ColeccionesService } from '../services/colecciones.service';
import { Router } from '@angular/router';

import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

import { InfiniteScrollCustomEvent } from '@ionic/angular';

import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';

import { ModalController } from '@ionic/angular';
import { FiltrosComponent } from '../modales/filtros/filtros.component';
import { DetalleCartaComponent } from '../modales/detalle-carta/detalle-carta.component';



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

  favoritosSet: Set<string> = new Set();

  textoBusqueda: string = ''; // Texto ingresado en la barra de búsqueda

  idUsiuario: any = ''; // ID del usuario logueado

  mostrarModal = false; // Controla la visibilidad del modal
  imagen_carta_seleccionada: string = ''; // Almacena la URL de la imagen seleccionada
  nombre_carta_seleccionada: string = ''; // 
  codigo_carta_seleccionada: string = ''; // 
  rareza_carta_seleccionada: string = ''; // 
  tipo_carta_seleccionada: string = ''; // 
  expansion_carta_seleccionada: string = ''; // 

  filtrosSeleccionados = {
    niveles: [],
    rarezas: [],
    tipos_carta: [],
    generaciones: [],
    expansiones: []
  };


  constructor(
    private cartasService: CartasService,
    private router: Router,
    private authService: AuthService,
    private coleccionesServies: ColeccionesService,
    private alertController: AlertController,
    private modalController: ModalController,
  ) { }

  async ngOnInit() {
    this.iniciarColecciones(); // cargar las colecciones al iniciar
    this.cartasTienda = await this.cartasService.descargarCartasDeTiendas();
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    this.favoritos = await this.coleccionesServies.cargarFavoritos(); // cargar los favoritos del usuario logueado
    console.log('Favoritos cargados:', this.favoritos);
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id));
    this.historial = await this.coleccionesServies.cargarHistorial(); // cargar los historial del usuario logueado
  }



  async abrirModalFiltros() {
    const modal = await this.modalController.create({
      component: FiltrosComponent,
      cssClass: 'filtros-modal',
      componentProps: {
        filtros: this.filtrosSeleccionados // <-- pasa los filtros actuales
      },
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((data) => {
      if (data.data) {
        console.log('Datos recibidos del modal:', data.data);
        this.filtrosSeleccionados = data.data; // <-- guarda los filtros seleccionados
        this.aplicarFiltrosPersonalizados(data.data);
      }
    });

    await modal.present();
  }

  aplicarFiltrosPersonalizados(filtros: any) {
    const { niveles, categoria, rarezas, tipos_carta, generaciones, expansiones } = filtros;
    console.log('Filtros aplicados:', filtros);

    // Filtrar las cartas según los niveles seleccionados, categoría, rarezas, tipos de carta, generaciones y expansiones
    this.cartas_filtradas = this.cartas_expansiones.filter((carta: any) => {
      return (
        (!niveles || niveles.length === 0 || niveles.includes(carta.categoria)) && // Filtrar por niveles
        (!categoria || carta.tipo_carta?.toLowerCase() === categoria.toLowerCase()) && // Filtrar por categoría
        (!rarezas || rarezas.length === 0 || rarezas.includes(carta.rareza)) && // Filtrar por rarezas
        (!tipos_carta || tipos_carta.length === 0 || tipos_carta.includes(carta.tipo_carta)) && // Filtrar por tipos de carta
        (!generaciones || generaciones.length === 0 || generaciones.some((gen: string) => carta.expansion.includes(gen))) && // Filtrar por generaciones
        (!expansiones || expansiones.length === 0 || expansiones.some((gen: string) => carta.expansion.includes(gen))) // Filtrar por expansiones
      );
    });

    // Actualizar las cartas mostradas con los primeros 12 elementos de las cartas filtradas
    this.cartas_mostradas = this.cartas_filtradas.slice(0, 12);

    console.log('Cartas filtradas:', this.cartas_filtradas);
    console.log('Cartas cargadas:', this.cartas_mostradas);
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

  // 1. Crear (o actualizar) el documento 'favoritos' en 'colecciones'
  await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos"), {
    nombre: "favoritos",
    creado: new Date()
  }, { merge: true });

  // 2. Agregar la carta a la subcolección 'cartas'
  await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos", "cartas", id), {
    nombre: nombre,
    codigo: codigo,
    id: id,
    imagen: imagen,
  });
  console.log('Favorito agregado:', id);
  this.favoritos = await this.coleccionesServies.cargarFavoritos();
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id)); // <-- Actualiza el Set
}

  async eliminarFavorito(id: string) {
    console.log("eliminar favorito", id);

    await deleteDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos", "cartas", id));
    this.favoritos = await this.coleccionesServies.cargarFavoritos();
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id)); // <-- Actualiza el Set
  }

  async agregarPropia(id: string, nombre: string, codigo: string, imagen: string, rareza:string) {
  console.log(`Acción 2 ejecutada para la carta con ID: ${id}`);

  console.log("Cartas de la tienda", this.cartasTienda);

  const cartasConPrecio = this.cartasTienda.filter((carta) => carta.coleccion === id);
  console.log(`Cartas filtradas por la colección "${id}":`, cartasConPrecio);

  const sumaPrecios = cartasConPrecio.reduce((acumulador: number, carta: any) => acumulador + carta.precio, 0);

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
        handler: async (data) => {
          // Validar que la cantidad sea al menos 1
          const cantidad = parseInt(data.cantidad, 10);
          if (!cantidad || cantidad < 1) {
            console.error('La cantidad debe ser al menos 1.');
            alert.dismiss();
            return false;
          }

          // Validar el precio promedio
          const precioFinal = data.precioPromedio ? parseFloat(data.precioPromedio) : precioPromedio;

          console.log(`Precio final guardado: ${precioFinal}`);
          console.log(`Cantidad guardada: ${cantidad}`);

          // 1. Crear (o actualizar) el documento 'propias' en 'colecciones'
          await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "propias"), {
            nombre: "propias",
            creado: new Date()
          }, { merge: true });

          // 2. Guardar los datos en la subcolección 'cartas'
          await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "propias", "cartas", id), {
            nombre: nombre,
            codigo: codigo,
            id: id,
            precio: precioFinal,
            cantidad: cantidad,
            imagen: imagen,
            rareza: rareza
          });

          return true;
        },
      },
    ],
  });

  await alert.present();
}

  accion3(id: string) {
    console.log(`Acción 3 ejecutada para la carta con ID: ${id}`);
    this.router.navigate(['/tabs/tab3', id]);
  }

  async verCarta(carta: any) {
    console.log('Ver carta:', carta);
    const modal = await this.modalController.create({
      component: DetalleCartaComponent,
      componentProps: {
        imagen: carta.imagen_url_grande,
        nombre: carta.nombre_espanol,
        codigo: carta.codigo,
        rareza: carta.rareza,
        tipo: carta.tipo_carta,
        expansion: carta.expansion
      }
    });
    await modal.present();
  }

  // Función para cerrar el modal
  cerrarModal(): void {
    this.mostrarModal = false; // Ocultar el modal
  }

  // Función para filtrar cartas según el texto ingresado
  filtrarCartas() {
    const texto = this.textoBusqueda.toLowerCase();

    // Filtrar por todos los campos relevantes excepto las imágenes
    this.cartas_filtradas = this.cartas_expansiones.filter((carta: any) => {
      return (
        (carta.id && carta.id.toLowerCase().includes(texto)) ||
        (carta.nombre_espanol && carta.nombre_espanol.toLowerCase().includes(texto)) ||
        (carta.nombre_ingles && carta.nombre_ingles.toLowerCase().includes(texto)) ||
        (carta.codigo && carta.codigo.toLowerCase().includes(texto)) ||
        (carta.coleccion && carta.coleccion.toLowerCase().includes(texto)) ||
        (carta.expansion && carta.expansion.toLowerCase().includes(texto)) ||
        (carta.categoria && carta.categoria.toLowerCase().includes(texto)) ||
        (carta.rareza && carta.rareza.toLowerCase().includes(texto)) ||
        (carta.tipo_carta && carta.tipo_carta.toLowerCase().includes(texto)) ||
        (carta.estado && carta.estado.toLowerCase().includes(texto))
      );
    });

    // Actualizar cartas_mostradas con los primeros 12 elementos de cartas_filtradas
    this.cartas_mostradas = this.cartas_filtradas.slice(0, 12);

    console.log('Cartas filtradas:', this.cartas_filtradas);
    console.log('Cartas cargadas:', this.cartas_mostradas);
  }

  async cotizar(id: string, nombre: string, codigo: string, imagen: string) {
  console.log("ID del usuario:", this.idUsiuario);
  console.log(`Cotizar carta con ID: ${id}`);

  // 1. Crear (o actualizar) el documento 'historial' en 'colecciones'
  await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "historial"), {
    nombre: "historial",
    creado: new Date()
  }, { merge: true });

  // 2. Agregar la carta a la subcolección 'cartas'
  await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "historial", "cartas", id), {
    nombre: nombre,
    codigo: codigo,
    id: id,
    imagen: imagen,
  });

  console.log('Historial agregado:', id);
  this.historial = await this.coleccionesServies.cargarHistorial(); // cargar el historial del usuario logueado

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