import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';
import { NavParams } from '@ionic/angular';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { DetalleCartaComponent } from '../detalle-carta/detalle-carta.component';
import { CartasService } from '../../services/cartas.service';

import { BarraProgresoComponent } from 'src/app/componentes/barra-progreso/barra-progreso.component';

import { AuthService } from '../../services/auth.service';

import { Router } from '@angular/router';

import { AgregarPropiasComponent } from '../../modales/agregar-propias/agregar-propias.component';
import { image } from 'd3';
import { CotizarComponent } from '../cotizar/cotizar.component';


@Component({
  selector: 'app-coleccion',
  templateUrl: './coleccion.component.html',
  styleUrls: ['./coleccion.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BarraProgresoComponent],
})
export class ColeccionComponent implements OnInit {

  idUsiuario: any = ''; // ID del usuario logueado

  // nombre de la colección que se pasa desde el modal
  @Input() coleccion: any;
  nombreColeccion: string = '';
  cartasFavoritas: any[] = [];
  cartas: any[] = [];
  cartas_propias: any[] = [];
  cartas_mostradas: any[] = [];
  cartas_mostradasSet: Set<string> = new Set();
  cartasPropiasSet: Set<string> = new Set();
  expansiones: any[] = [];
  cantidadMatches: number = 0;
  totalPrecio: number = 0;
  cartas_tiendas: any[] = [];
  cartas_tiendas_propias: any[] = [];

  favoritos: any[] = []; // guarda las cartas de todas las tiendas
  favoritosSet: Set<string> = new Set();

  cartasTienda: any[] = []; // guarda las cartas de todas las tiendas

  nombreheader: string = "";

  cartas_propias_del_set: any[] = []; // cartas propias del set

  constructor(
    private router: Router,
    private modalController: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
    private cartasService: CartasService,
    private coleccionesServies: ColeccionesService,
    private authService: AuthService,
  ) { }

  // función principal que se ejecuta al iniciar el componente
  async ngOnInit() {
    console.log('coleccion: ', this.coleccion);
    this.nombreColeccion = this.coleccion.id
    this.nombreheader = this.extraerNombreColeccion(this.coleccion.nombre);
    this.nombreheader = this.nombreheader.charAt(0).toUpperCase() + this.nombreheader.slice(1);

    this.idUsiuario = await this.authService.getCurrentUser();

    // carga las cartas de la colección seleccionada y las cartas propias del usuario
    await this.cargarCartasColeccionYPropias();

    this.favoritos = await this.coleccionesServies.cargarFavoritos(); // cargar los favoritos del usuario logueado
    // console.log('Favoritos cargados:', this.favoritos);
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id));


    await this.actuaalizarDatos();
    console.log('Cartas al final del ngOnInit:', this.cartas_mostradas);
    this.cartas_mostradasSet = new Set(this.cartas_mostradas.map(c => c.id));
    console.log('Cartas mostradas Set:', this.cartas_mostradasSet);
    this.cartas_propias_del_set = this.cartas.filter(carta => this.cartasPropiasSet.has(carta.id));
    console.log('Cartas propias del set:', this.cartas_propias_del_set);
    this.calcularResumenColeccion();
  }

  async actuaalizarDatos() {
    this.cartasTienda = await this.cartasService.descargarCartasDeTiendas();

    // crea un set con los ids de las cartas propias para comparación rápida
    await this.crearSetCartasPropias();

    // agrega los datos de precio y cantidad a las cartas de la colección si existen en cartas propias
    this.unificarDatosCartas();

    // calcula la cantidad de matches y el total del precio de las cartas propias de la colección


    this.favoritos = await this.coleccionesServies.recargarFavoritos();
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id)); // <-- Actualiza el Set
  }

  extraerNombreColeccion(nombre: string): string {
    if (!nombre) return '';
    const partes = nombre.split(':');
    if (partes.length > 1) {
      // Retorna el texto después de los dos puntos, quitando espacios al inicio
      return partes[1].trim();
    }
    // Si no hay dos puntos, retorna el nombre original
    return nombre;
  }

  // carga las cartas de la colección seleccionada y las cartas propias del usuario
  async cargarCartasColeccionYPropias() {
    // console.log('Cargando cartas de la colección:', this.nombreColeccion);
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    // muestra en consola las cartas obtenidas
    // console.log('cartas:', this.cartas);

    // si no hay cartas en la colección, intenta obtenerlas desde las expansiones
    if (this.cartas.length === 0) {
      await this.cargarCartasDesdeExpansiones();
    }
    // carga las cartas de tiendas y filtra las que tienes en propias
    await this.cargarCartasTiendasYPropias();

  }

  // si no hay cartas en la colección, las obtiene desde las expansiones y las mapea al formato estándar
  async cargarCartasDesdeExpansiones() {

    this.expansiones = await this.cartasService.expansiones();
    // console.log('expansiones:', this.expansiones);

    // filtra y mapea para unificar el formato
    this.cartas = this.expansiones
      .filter(expansion => expansion.coleccion === this.nombreColeccion)
      .map(expansion => ({
        id: expansion.id,
        nombre_espanol: expansion.nombre_espanol,
        codigo: expansion.codigo,
        imagen_url: expansion.imagen_url,
        imagen_url_grande: expansion.imagen_url_grande,
        rareza: expansion.rareza,
        estado: expansion.estado,
        expansion: expansion.expansion,
        coleccion: expansion.coleccion,
        tipo_carta: expansion.tipo_carta,
      }));

    // console.log('cartas filtradas y mapeadas:', this.cartas);
  }

  // compara la cartas propias con las del set y crea un set de ids
  async crearSetCartasPropias() {
    this.cartas_propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    console.log('cartas propias:', this.cartas_propias);
    this.cartasPropiasSet = new Set(this.cartas_propias.map(c => c.id));
    // console.log('set de cartas propias:', this.cartasPropiasSet);
  }

  // carga las cartas de tiendas y filtra las que tienes en propias
  async cargarCartasTiendasYPropias() {
    this.cartas_tiendas = await this.cartasService.descargarCartasDeTiendas();
    // console.log('cartas de tiendas:', this.cartas_tiendas);

    this.cartas_tiendas_propias = this.cartas_tiendas.filter(carta => this.cartasPropiasSet.has(carta.coleccion));
    // console.log('cartas de tiendas que tienes en propias:', this.cartas_tiendas_propias);
  }

  unificarDatosCartas() {
    // Idiomas base
    const idiomasBase = ["Español", "Inglés", "Japonés"];
  
    this.cartas = this.cartas.map(carta => {
      // Busca todas las cartas propias con el mismo id
      const propias = this.cartas_propias.filter(cp => cp.id === carta.id);
  
      // Inicializa arrays para los 3 idiomas base
      let precio: number[] = [0, 0, 0];
      let cantidad: number[] = [0, 0, 0];
      let idioma: string[] = [...idiomasBase];
      let valor_mercado: number[] = [0, 0, 0];
  
      // Rellena los arrays con los datos de propias si existen
      idiomasBase.forEach((idiomaBase, idx) => {
        const propiaIdx = propias.findIndex(p => {
          if (Array.isArray(p.idioma)) {
            return p.idioma.includes(idiomaBase);
          }
          return p.idioma === idiomaBase;
        });
        if (propiaIdx !== -1) {
          const propia = propias[propiaIdx];
          precio[idx] = Array.isArray(propia.precio) ? Number(propia.precio[0]) || 0 : Number(propia.precio) || 0;
          cantidad[idx] = Array.isArray(propia.cantidad) ? Number(propia.cantidad[0]) || 0 : Number(propia.cantidad) || 0;
        }
        // Busca valor de mercado en tiendas para ese idioma
        const tienda = this.cartas_tiendas.find(
          t => (t.coleccion === carta.id || t.codigo_carta === carta.codigo) && t.idioma?.toLowerCase() === idiomaBase.toLowerCase()
        );
        valor_mercado[idx] = tienda ? Number(tienda.precio) : 0;
      });
  
      return {
        ...carta,
        precio,
        cantidad,
        idioma,
        valor_mercado
      };
    });
  
    // cartas_mostradas: toma el primer valor de cada campo (Español por defecto)
    const cartasTemp = this.cartas.map(carta => ({
      ...carta,
      precio: Array.isArray(carta.precio) && carta.precio.length > 0 ? carta.precio[0] : 0,
      cantidad: Array.isArray(carta.cantidad) && carta.cantidad.length > 0 ? carta.cantidad[0] : 0,
      idioma: Array.isArray(carta.idioma) && carta.idioma.length > 0 ? carta.idioma[0] : "Español",
      valor_mercado: Array.isArray(carta.valor_mercado) && carta.valor_mercado.length > 0 ? carta.valor_mercado[0] : 0
    }));
  
    // Filtra para dejar solo un objeto por id único
    const idsUnicos = new Set();
    this.cartas_mostradas = cartasTemp.filter(carta => {
      if (idsUnicos.has(carta.id)) {
        return false;
      }
      idsUnicos.add(carta.id);
      return true;
    });
  
    console.log('Cartas mostradas unificadas:', this.cartas_mostradas);
  }

  // calcula la cantidad de matches y el total del precio de las cartas propias de la colección
  calcularResumenColeccion() {
    // obtiene las cartas de la colección que también están en cartas propias
    const matches = this.cartas.filter(carta => this.cartasPropiasSet.has(carta.id));
    this.cantidadMatches = matches.length;

    // suma el precio total de las cartas propias (considerando cantidad y arrays)
    this.totalPrecio = this.cartas_propias_del_set.reduce((acc, carta) => {
      let totalCarta = 0;
      // Si precio y cantidad son arrays, suma el producto de cada par
      if (Array.isArray(carta.precio) && Array.isArray(carta.cantidad)) {
        for (let i = 0; i < carta.precio.length; i++) {
          const precio = Number(carta.precio[i]) || 0;
          const cantidad = Number(carta.cantidad[i]) || 0;
          totalCarta += precio * cantidad;
        }
      } else {
        // Si no son arrays, multiplica directamente
        const precio = Number(carta.precio) || 0;
        const cantidad = Number(carta.cantidad) || 0;
        totalCarta = precio * cantidad;
      }
      return acc + totalCarta;
    }, 0);
  }

  // cierra el modal
  cerrar() {
    this.modalController.dismiss();
  }

  // cierra el modal (alias)
  async cerrarModal() {
    this.modalController.dismiss();
  }

  // elimina una carta de la colección seleccionada
  async eliminarCarta(carta: any) {
    console.log("eliminar carta:", carta.id);
    await deleteDoc(doc(db, "usuarios", this.coleccionesService.idUsuarios, "colecciones", this.nombreColeccion, "cartas", carta.id));
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
  }

  async agregarFavorito(carta: any) {
    console.log(`Agregar a Favorito carta con ID: ${carta}`);
    await this.coleccionesService.agregar_a_coleccion(carta, "favoritos");

    console.log('Favorito agregado:', carta.id);
    this.favoritos = await this.coleccionesServies.recargarFavoritos();
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id)); // <-- Actualiza el Set
  }

  async eliminarFavorito(id: string) {
    console.log("eliminar favorito", id);
    console.log("eliminar favorito", this.idUsiuario);

    await deleteDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "favoritos", "cartas", id));
    this.favoritos = await this.coleccionesServies.recargarFavoritos();
    this.favoritosSet = new Set(this.favoritos.map(fav => fav.id)); // <-- Actualiza el Set
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

  estadisticas(carta: any) {
    console.log(`Acción 3 ejecutada para la carta con ID: ${carta.id}`);
    this.router.navigate(['/tabs/tab3', carta.id]);
    this.cerrar();
  }

  async cotizar(carta: any) {
    console.log("ID del usuario:", this.idUsiuario);
    console.log(`Cotizar carta con ID: ${carta.id}`);

    this.coleccionesService.agregar_a_coleccion(carta, "historial");

    // Abre el modal Cotizar y envía la carta como variable
    const modal = await this.modalController.create({
      component: CotizarComponent, // Asegúrate de importar CotizarComponent
      componentProps: {
        carta: carta
      }
    });
    await modal.present();
  }

  async agregarPropia(carta_guardada: any) {
    // console.log(`Acción 2 ejecutada para la carta con ID: `, carta_guardada);

    // console.log("Cartas de la tienda", this.cartasTienda);

    const cartasConPrecio = this.cartasTienda.filter((carta) => carta.coleccion === carta.id);
    // console.log(`Cartas filtradas por la colección "${carta_guardada.id}":`, cartasConPrecio);

    const sumaPrecios = cartasConPrecio.reduce((acumulador: number, carta: any) => acumulador + carta.precio, 0);
    const precioPromedio = cartasConPrecio.length ? sumaPrecios / cartasConPrecio.length : 0;

    // Abre el modal personalizado
    const modal = await this.modalController.create({
      component: AgregarPropiasComponent,
      componentProps: {
        dinero: precioPromedio ? `$${parseInt(precioPromedio.toString(), 10).toLocaleString('es-CL')}` : '',
        cantidad: 1,
        idioma: 'Español'
      }
    });

    modal.onDidDismiss().then(async (result) => {
      // console.log('Modal cerrado con resultado:', result);
      if (result.data && Array.isArray(result.data)) {
        // 1. Crear (o actualizar) el documento 'propias' en 'colecciones'
        await setDoc(doc(db, "usuarios", this.idUsiuario, "colecciones", "propias"), {
          nombre: "propias",
          creado: new Date()
        }, { merge: false });

        // 2. Guardar cada carta en la subcolección 'car  tas'
        for (const carta of result.data) {
          // console.log('Carta seleccionada:', carta);
          await setDoc(
            doc(db, "usuarios", this.idUsiuario, "colecciones", "propias", "cartas", carta_guardada.id + '-' + carta.idioma),
            {
              codigo: carta_guardada.codigo,
              coleccion: carta_guardada.coleccion,
              estado: carta_guardada.estado,
              expansion: carta_guardada.expansion,
              id: carta_guardada.id,
              imagen_url: carta_guardada.imagen_url,
              imagen_url_grande: carta_guardada.imagen_url_grande,
              nombre_espanol: carta_guardada.nombre_espanol,
              rareza: carta_guardada.rareza,
              tipo_carta: carta_guardada.tipo_carta,
              precio: carta.dinero,
              cantidad: carta.cantidad,
              idioma: carta.idioma,
            }, { merge: true }
          );
        }

        // console.log('Cartas guardadas en la colección "propias"');

        // await this.crearSetCartasPropias();

        await this.actuaalizarDatos();
        this.calcularResumenColeccion();
      }
    });

    // console.log('Propia agregada:', carta_guardada.id);

    await modal.present();

  }

  idioma_seleccionado: number = 0; // Variable para almacenar el idioma seleccionado

  seleccionarIdioma(carta: any, idioma: string) {
    // Busca la carta en la lista this.cartas por id
    const cartaEncontrada = this.cartas.find(c => c.id === carta.id);
    const indice = cartaEncontrada && cartaEncontrada.idioma ? cartaEncontrada.idioma.indexOf(idioma) : -1;

    if (indice !== -1) {
      // Busca la carta en cartas_mostradas y actualiza solo esa carta
      const cartaMostrada = this.cartas_mostradas.find(c => c.id === carta.id);
      if (cartaMostrada) {
        cartaMostrada.precio = Array.isArray(cartaEncontrada.precio) ? cartaEncontrada.precio[indice] : cartaEncontrada.precio;
        cartaMostrada.cantidad = Array.isArray(cartaEncontrada.cantidad) ? cartaEncontrada.cantidad[indice] : cartaEncontrada.cantidad;
        cartaMostrada.idioma = idioma;
        cartaMostrada.valor_mercado = Array.isArray(cartaEncontrada.valor_mercado) ? cartaEncontrada.valor_mercado[indice] : cartaEncontrada.valor_mercado;
      }
    }
    // this.cartas_mostradas = [...this.cartas_mostradas];

    // console.log(`Idioma seleccionado para la carta con ID ${carta.id}: ${idioma}, índice: ${indice}`);
    // console.log('Cartas encontradas:', cartaEncontrada);
    // console.log('Cartas mostradas encontradas:', this.cartas_mostradas.find(c => c.id === carta.id));
  }

  idiomaDisponible(carta: any, idioma: string): boolean {
    if (Array.isArray(carta.idioma)) {
      return carta.idioma.includes(idioma);
    }
    return carta.idioma === idioma;
  }

  scrollToTop() {
    console.log('Scroll to top');
    const content = document.getElementById('main-content');
    if (content) {
      (content as any).scrollToTop ? (content as any).scrollToTop(500) : content.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

}