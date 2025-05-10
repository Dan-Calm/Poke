import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';


@Component({
  selector: 'app-modal-favoritos',
  templateUrl: './modal-favoritos.component.html',
  styleUrls: ['./modal-favoritos.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ModalFavoritosComponent {
  cartasFavoritas: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService
  ) {}

  async ngOnInit() {
    this.cartasFavoritas = await this.coleccionesService.listaFavoritos();
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
}
