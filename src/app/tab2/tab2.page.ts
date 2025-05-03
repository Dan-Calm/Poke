import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CartasService } from '../services/cartas.service';import { SelectorExpansionesComponent } from '../modales/selector-expansiones/selector-expansiones.component';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  expansiones: any[] = [];
  
  constructor(
    private cartasService: CartasService,
    private modalController: ModalController

  ) {}

  async ngOnInit() {
    console.log('ngOnInit Tab2Page');
    
    this.expansiones = await this.cartasService.expansiones();

  }

  async abrirSelectorExpansiones() {
  
    const modal = await this.modalController.create({
      component: SelectorExpansionesComponent,
      componentProps: {
        expansiones: this.expansiones,
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
