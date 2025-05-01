import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-selector-expansiones',
  templateUrl: './selector-expansiones.component.html',
  styleUrls: ['./selector-expansiones.component.scss'],
  imports: [CommonModule, IonicModule],
})
export class SelectorExpansionesComponent {
  @Input() expansiones: any[] = [];

  constructor(private modalCtrl: ModalController) {}

  seleccionarExpansion(expansion: any) {
    this.modalCtrl.dismiss(expansion); // Retorna la expansión seleccionada
  }

  cerrar() {
    this.modalCtrl.dismiss(); // Cierra sin seleccionar nada
  }
}
