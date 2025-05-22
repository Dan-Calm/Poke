import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from 'src/app/services/colecciones.service';
import { NavParams } from '@ionic/angular';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from 'src/app/config/firebase.config';

import { DetalleCartaComponent } from '../detalle-carta/detalle-carta.component';
import { CartasService } from '../../services/cartas.service';

import { BarraProgresoComponent } from 'src/app/componentes/barra-progreso/barra-progreso.component';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-modal-propias',
  templateUrl: './modal-propias.component.html',
  styleUrls: ['./modal-propias.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ModalPropiasComponent implements OnInit {

  propias: any[] = [];
  total_precio: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private coleccionesService: ColeccionesService,
    private navParams: NavParams,
    private cartasService: CartasService,
    private authService: AuthService,
  ) { }

  async ngOnInit() {
    this.propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    console.log('Cartas propias:', this.propias);
    this.calcularPrecioTotal();
  }

  async editarCarta(carta: any) {
    const id_usuario = this.authService.getCurrentUser();
    console.log('ID usuario:', id_usuario);
    // await setDoc(doc(db, "usuarios", id_usuario, "colecciones", "propias", "cartas", carta.id), {
    //   nombre: nombre,
    //   codigo: codigo,
    //   id: id,
    //   imagen: imagen,
    // });
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

}
