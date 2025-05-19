import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';
import { NavParams } from '@ionic/angular';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from 'src/app/config/firebase.config';



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

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
  ) {}

  async ngOnInit() {
    this.nombreColeccion = this.navParams.get('nombreColeccion');
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    this.cartasFavoritas = await this.coleccionesService.listaFavoritos();
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
    
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
}
