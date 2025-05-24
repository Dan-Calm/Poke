import { Component, OnInit, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../componentes/modal/modal.component';

@Component({
  selector: 'app-detalle-carta',
  templateUrl: './detalle-carta.component.html',
  styleUrls: ['./detalle-carta.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ModalComponent]
})
export class DetalleCartaComponent implements OnInit {
  @Input() imagen: string = '';
  @Input() nombre: string = '';
  @Input() codigo: string = '';
  @Input() rareza: string = '';
  @Input() tipo: string = '';
  @Input() expansion: string = '';

  constructor(
    public modalController: ModalController
  ) { }

  ngOnInit() { }

  cerrar() {
    this.modalController.dismiss();
  }
}