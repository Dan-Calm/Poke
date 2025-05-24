import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';

interface CartaIdioma {
  dinero: number;
  cantidad: number;
  idioma: string;
}

@Component({
  selector: 'app-agregar-propias',
  templateUrl: './agregar-propias.component.html',
  styleUrls: ['./agregar-propias.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AgregarPropiasComponent {
  dinero: string = '';
  cantidad: number | null = null;
  idioma: string = '';
  idiomas: string[] = ['Español', 'Inglés', 'Japonés'];

  cartasPorIdioma: CartaIdioma[] = [];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  formatearCLP(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor) {
      valor = parseInt(valor, 10).toLocaleString('es-CL');
      this.dinero = `$${valor}`;
    } else {
      this.dinero = '';
    }
  }

  async mostrarToast(mensaje: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  validarCampos(): { valido: boolean, mensaje?: string } {
    const valorNumerico = Number(this.dinero.replace(/\D/g, ''));
    if (!valorNumerico || valorNumerico <= 0) {
      return { valido: false, mensaje: 'Ingresa un monto válido en CLP.' };
    }
    if (!this.cantidad || this.cantidad < 1) {
      return { valido: false, mensaje: 'La cantidad debe ser mayor a 0.' };
    }
    if (!this.idioma) {
      return { valido: false, mensaje: 'Selecciona un idioma.' };
    }
    return { valido: true };
  }

  agregar() {
    const validacion = this.validarCampos();
    if (!validacion.valido) {
      this.mostrarToast(validacion.mensaje!);
      return;
    }
    const valorNumerico = Number(this.dinero.replace(/\D/g, ''));
    // Si ya existe ese idioma, reemplaza el valor
    const idx = this.cartasPorIdioma.findIndex(c => c.idioma === this.idioma);
    const nuevaCarta: CartaIdioma = {
      dinero: valorNumerico,
      cantidad: this.cantidad!,
      idioma: this.idioma
    };
    if (idx !== -1) {
      this.cartasPorIdioma[idx] = nuevaCarta;
      this.mostrarToast('Idioma actualizado en la lista.', 'primary');
    } else {
      this.cartasPorIdioma.push(nuevaCarta);
      this.mostrarToast('Carta añadida a la lista.', 'success');
    }
    // Limpia los campos para facilitar el ingreso de otra carta
    this.dinero = '';
    this.cantidad = 1;
    this.idioma = '';
  }

  eliminarDeLista(idioma: string) {
    this.cartasPorIdioma = this.cartasPorIdioma.filter(c => c.idioma !== idioma);
    this.mostrarToast('Carta eliminada de la lista.', 'warning');
  }

guardar() {
  if (this.cartasPorIdioma.length === 0) {
    this.mostrarToast('Debes agregar al menos una carta a la lista.');
    return;
  }
  this.modalCtrl.dismiss(this.cartasPorIdioma);
}

  cancelar() {
    this.modalCtrl.dismiss();
  }
}