import { Component, OnInit } from '@angular/core';
import { CartasService } from '../services/cartas.service';

import { ModalController } from '@ionic/angular';
import { SelectorExpansionesComponent } from '../modales/selector-expansiones/selector-expansiones.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  expansiones: any[] = [];

  constructor(
    private cartasService: CartasService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.expansiones = await this.cartasService.colecciones();
  }

  async abrirSelectorExpansiones() {
    const expansiones = await this.cartasService.colecciones();
  
    const modal = await this.modalController.create({
      component: SelectorExpansionesComponent,
      componentProps: {
        expansiones: expansiones,
      },
    });
  
    await modal.present();
  
    const { data } = await modal.onDidDismiss();
  
    if (data) {
      console.log('Expansión seleccionada:', data);
      // Aquí puedes continuar: clonar la expansión, asociarla al usuario, etc.
    }
  }

  mostrarFavoritos() {
    // Este lo implementamos en el siguiente paso
  }
}


