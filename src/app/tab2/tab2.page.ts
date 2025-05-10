import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CartasService } from '../services/cartas.service';
import { SelectorExpansionesComponent } from '../modales/selector-expansiones/selector-expansiones.component';
import { AuthService } from '../services/auth.service';
import { ColeccionesService } from '../services/colecciones.service';
import { ModalFavoritosComponent } from '../modales/modal-favoritos/modal-favoritos.component';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  expansiones: any[] = [];
  cartasFavoritas: any[] = [];
  modoFavoritos: boolean = false;
  
  constructor(
    private cartasService: CartasService,
    private modalController: ModalController,
    private authService: AuthService,
    private coleccionesService: ColeccionesService
  ) { }

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
  
  async mostrarFavoritos() {
    const modal = await this.modalController.create({
      component: ModalFavoritosComponent,
    });
    await modal.present();
  }

}
