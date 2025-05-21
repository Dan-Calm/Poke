import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';
import { NavParams } from '@ionic/angular';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from 'src/app/config/firebase.config';
import { DetalleCartaComponent } from '../detalle-carta/detalle-carta.component';
import { CartasService } from '../../services/cartas.service';

import { BarraProgresoComponent } from 'src/app/componentes/barra-progreso/barra-progreso.component';

@Component({
  selector: 'app-modal-favoritos',
  templateUrl: './modal-favoritos.component.html',
  styleUrls: ['./modal-favoritos.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BarraProgresoComponent],
})
export class ModalFavoritosComponent implements OnInit {
  // nombre de la colección que se pasa desde el modal
  @Input() nombreColeccion!: string;
  cartasFavoritas: any[] = [];
  cartas: any[] = [];
  cartas_propias: any[] = [];
  cartasPropiasSet: Set<string> = new Set();
  expansiones: any[] = [];
  cantidadMatches: number = 0;
  totalPrecio: number = 0;
  cartas_tiendas: any[] = [];
  cartas_tiendas_propias: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
    private cartasService: CartasService,
  ) { }

  // función principal que se ejecuta al iniciar el componente
  async ngOnInit() {
    // obtiene el nombre de la colección desde los parámetros del modal
    this.nombreColeccion = this.navParams.get('nombreColeccion');

    // carga las cartas de la colección seleccionada y las cartas propias del usuario
    await this.cargarCartasColeccionYPropias();

    // si no hay cartas en la colección, intenta obtenerlas desde las expansiones
    if (this.cartas.length === 0) {
      await this.cargarCartasDesdeExpansiones();
    }

    // crea un set con los ids de las cartas propias para comparación rápida
    this.crearSetCartasPropias();

    // carga las cartas de tiendas y filtra las que tienes en propias
    await this.cargarCartasTiendasYPropias();

    // agrega los datos de precio y cantidad a las cartas de la colección si existen en cartas propias
    this.unificarDatosCartas();

    // calcula la cantidad de matches y el total del precio de las cartas propias de la colección
    this.calcularResumenColeccion();
  }

  // carga las cartas de la colección seleccionada y las cartas propias del usuario
  async cargarCartasColeccionYPropias() {
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    this.cartas_propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    // muestra en consola las cartas obtenidas
    console.log('cartas:', this.cartas);
    console.log('cartas propias:', this.cartas_propias);
  }

  // si no hay cartas en la colección, las obtiene desde las expansiones y las mapea al formato estándar
  async cargarCartasDesdeExpansiones() {
    console.log('no hay cartas en la colección:', this.nombreColeccion);
    this.expansiones = await this.cartasService.expansiones();
    console.log('expansiones:', this.expansiones);

    // filtra y mapea para unificar el formato
    this.cartas = this.expansiones
      .filter(expansion => expansion.coleccion === this.nombreColeccion)
      .map(expansion => ({
        id: expansion.id,
        nombre: expansion.nombre_espanol,
        imagen: expansion.imagen_url,
        rareza: expansion.rareza,
        codigo: expansion.codigo,
        expansion: expansion.expansion,
        tipo_carta: expansion.tipo_carta,
        estado: expansion.estado,
      }));

    console.log('cartas filtradas y mapeadas:', this.cartas);
  }

  // compara la cartas propias con las del set y crea un set de ids
  crearSetCartasPropias() {
    this.cartasPropiasSet = new Set(this.cartas_propias.map(c => c.id));
    console.log('set de cartas propias:', this.cartasPropiasSet);
  }

  // carga las cartas de tiendas y filtra las que tienes en propias
  async cargarCartasTiendasYPropias() {
    this.cartas_tiendas = await this.cartasService.descargarCartasDeTiendas();
    console.log('cartas de tiendas:', this.cartas_tiendas);

    this.cartas_tiendas_propias = this.cartas_tiendas.filter(carta => this.cartasPropiasSet.has(carta.coleccion));
    console.log('cartas de tiendas que tienes en propias:', this.cartas_tiendas_propias);
  }

  // agrega los datos de precio y cantidad a las cartas de la colección si existen en cartas propias
  unificarDatosCartas() {
    this.cartas = this.cartas.map(carta => {
      const propia = this.cartas_propias.find(cp => cp.id === carta.id);
      return {
        ...carta,
        precio: propia ? propia.precio : null,
        cantidad: propia ? propia.cantidad : null
      };
    });
  }

  // calcula la cantidad de matches y el total del precio de las cartas propias de la colección
  calcularResumenColeccion() {
    // obtiene las cartas de la colección que también están en cartas propias
    const matches = this.cartas.filter(carta => this.cartasPropiasSet.has(carta.id));
    this.cantidadMatches = matches.length;
    console.log('cantidad de cartas de la expansión que tienes en propias:', this.cantidadMatches);

    // suma el precio total de las cartas propias de la colección (considerando cantidad)
    this.totalPrecio = matches.reduce((acc, carta) => {
      if (carta.precio && carta.cantidad) {
        return acc + (carta.precio * carta.cantidad);
      } else if (carta.precio) {
        return acc + carta.precio;
      }
      return acc;
    }, 0);

    console.log('total precio de cartas propias de la colección:', this.totalPrecio);
    console.log('cantidad de cartas en la colección:', this.cartas.length);
  }

  // cierra el modal
  cerrar() {
    this.modalCtrl.dismiss();
  }

  // elimina una carta de favoritos
  async eliminarFavorito(carta: any) {
    try {
      this.cartasFavoritas = await this.coleccionesService.eliminarCartaFavorita(carta.id);
    } catch (error) {
      console.error('error al eliminar carta favorita:', error);
    }
  }

  // cierra el modal (alias)
  async cerrarModal() {
    this.modalCtrl.dismiss();
  }

  // elimina una carta de la colección seleccionada
  async eliminarCarta(carta: any) {
    console.log("eliminar carta:", carta.id);
    await deleteDoc(doc(db, "usuarios", this.coleccionesService.idUsuarios, "colecciones", this.nombreColeccion, "cartas", carta.id));
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
  }

  // abre el modal de detalle de carta
  async verCarta(carta: any) {
    console.log('ver carta:', carta);
    const modal = await this.modalCtrl.create({
      component: DetalleCartaComponent,
      componentProps: {
        imagen: carta.imagen,
        nombre: carta.nombre,
        codigo: carta.codigo,
        rareza: carta.rareza,
        tipo: carta.tipo_carta,
        expansion: carta.expansion
      }
    });
    await modal.present();
  }
}