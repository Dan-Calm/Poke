import { Component, OnInit } from '@angular/core';
import { CartasService } from '../services/cartas.service';

import { db } from '../config/firebase.config';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  cartas_expansiones: any[] = [];
  cartas_pendientes: any[] = [];
  cartaActualIndex: number = 0;

  constructor(private cartasService: CartasService) { }

  async ngOnInit() {
    this.cartas_expansiones = await this.cartasService.expansiones();
    this.cartas_pendientes = this.cartas_expansiones.filter(carta => carta.estado === 'pendiente');
  }

  confirmarCarta(carta: any) {
    // Aquí puedes marcar la carta como revisada y pasar a la siguiente
    console.log('Carta confirmada:', carta);
    const coleccion = doc(db, 'expansiones', carta.coleccion, 'cartas', carta.id);
    setDoc(coleccion, { estado: 'revisada' }, { merge: true })
    this.cartaActualIndex++;


  }
  async editarImagen(carta: any) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Editar imágenes';
    alert.inputs = [
      {
      name: 'imagen',
      type: 'text',
      placeholder: 'URL de la imagen',
      value: carta.imagen_url || '',
      label: 'Imagen pequeña'
      },
      {
      name: 'imagen_grande',
      type: 'text',
      placeholder: 'URL de la imagen grande',
      value: carta.imagen_url_grande || '',
      label: 'Imagen grande'
      }
    ];
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Guardar',
        handler: (data: any) => {
          carta.imagen_url = data.imagen;
          carta.imagen_url_grande = data.imagen_grande;
          const coleccion = doc(db, 'expansiones', carta.coleccion, 'cartas', carta.id);
          setDoc(coleccion, {
            imagen_url: carta.imagen_url,
            imagen_url_grande: carta.imagen_url_grande
          }, { merge: true });
          // Aquí deberías guardar el cambio en tu backend o servicio
          // this.cartaActualIndex++;
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  get cartaActual() {
    return this.cartas_pendientes[this.cartaActualIndex];
  }
}