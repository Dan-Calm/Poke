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
  selector: 'app-modal-propias',
  templateUrl: './modal-propias.component.html',
  styleUrls: ['./modal-propias.component.scss'],
    standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ModalPropiasComponent implements OnInit {
  @Input() nombreColeccion!: string;
  cartas: any[] = [];
  propias: any[] = [];
  total_precio: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
    private cartasService: CartasService,
  ) { }

  async ngOnInit() {
    this.propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    console.log('Cartas propias:', this.propias);
    this.calcularPrecioTotal();
  }

  calcularPrecioTotal() {
    this.total_precio = this.propias.reduce((total, carta) => {
      return total + (carta.precio * carta.cantidad);
    }, 0);
  }

  async cerrarModal() {
    this.modalCtrl.dismiss();
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

  async eliminarCarta(carta: any) {
    console.log("eliminar carta:", carta.id);
    await deleteDoc(doc(db, "usuarios", this.coleccionesService.idUsuarios, "colecciones", this.nombreColeccion, "cartas", carta.id));
    this.cartas = await this.coleccionesService.cargarCartasDeColeccion(this.nombreColeccion);
  }

}
