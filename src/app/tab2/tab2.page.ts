import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CartasService } from '../services/cartas.service';
import { SelectorExpansionesComponent } from '../modales/selector-expansiones/selector-expansiones.component';
import { AuthService } from '../services/auth.service';
import { ColeccionesService } from '../services/colecciones.service';
import { ModalFavoritosComponent } from '../modales/modal-favoritos/modal-favoritos.component';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';


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
  coleccionesUsuario: string[] = [];
  
  constructor(
    private cartasService: CartasService,
    private modalController: ModalController,
    private authService: AuthService,
    private coleccionesService: ColeccionesService
  ) { }

  async ionViewWillEnter() {
  await this.cargarColecciones();
}

  async ngOnInit() {
    console.log('ngOnInit Tab2Page');
    
    this.expansiones = await this.cartasService.expansiones();
    this.cartasFavoritas = await this.coleccionesService.listaFavoritos();
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

  async mostrarColeccion(nombreColeccion: string) {
  const modal = await this.modalController.create({
    component: ModalFavoritosComponent,
    componentProps: {
      nombreColeccion: nombreColeccion
    }
  });
  await modal.present();
}

async cargarColecciones() {
  await this.coleccionesService.obtenerIdUsuario(); // asegúrate que idUsuarios esté listo
  const referencia = collection(db, 'usuarios', this.coleccionesService.idUsuarios, 'colecciones');
  const snapshot = await getDocs(referencia);
  this.coleccionesUsuario = snapshot.docs
    .map(doc => doc.id)
    .filter(id => id !== 'favoritos'); // opcional: excluir favoritos
  console.log('Colecciones de usuario tab2:', this.coleccionesUsuario);
}


}
