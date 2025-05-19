import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';
import { NavParams } from '@ionic/angular';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from 'src/app/config/firebase.config';
import { DetalleCartaComponent } from '../detalle-carta/detalle-carta.component';

import { CartasService } from '../../services/cartas.service';

@Component({
  selector: 'app-modal-favoritos',
  templateUrl: './modal-favoritos.component.html',
  styleUrls: ['./modal-favoritos.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ModalFavoritosComponent {
  @Input() nombreColeccion!: string;
  cartasFavoritas: any[] = [];
  cartas: any[] = [];
  expansiones: any[] = [];
  modalController: any;

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
    private cartasService: CartasService,
  ) {}

  async ngOnInit() {
    this.nombreColeccion = this.navParams.get('nombreColeccion');
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    this.cartasFavoritas = await this.coleccionesService.listaFavoritos();
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    console.log('cartas:', this.cartas);
if (this.cartas.length === 0) {
  console.log('No hay cartas en la colección:', this.nombreColeccion);
  this.expansiones = await this.cartasService.expansiones();
  console.log('Expansiones:', this.expansiones);

  // Filtra y mapea para unificar el formato
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

  console.log('Cartas filtradas y mapeadas:', this.cartas);
}
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async eliminarFavorito(carta: any) {
    try {
      this.cartasFavoritas = await this.coleccionesService.eliminarCartaFavorita(carta.id);
    } catch (error) {
      console.error('Error al eliminar carta favorita:', error);
    }
  }

  
async cerrarModal() {
  this.modalCtrl.dismiss();
}

async eliminarCarta(carta: any) {
  console.log("Eliminar carta:", carta.id);

  await deleteDoc(doc(db, "usuarios", this.coleccionesService.idUsuarios, "colecciones", this.nombreColeccion, "cartas", carta.id));
  this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
}

async verCarta(carta: any) {
    console.log('Ver carta:', carta);
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
