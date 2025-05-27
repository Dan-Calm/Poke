import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CartasService } from '../services/cartas.service';
import { SelectorExpansionesComponent } from '../modales/selector-expansiones/selector-expansiones.component';
import { AuthService } from '../services/auth.service';
import { ColeccionesService } from '../services/colecciones.service';
import { ColeccionComponent } from '../modales/coleccion/coleccion.component';
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
  expansiones_info: any[] = [];
  colecciones_usuario: any[] = [];
  iconos: any[] = [];

  constructor(
    private cartasService: CartasService,
    private modalController: ModalController,
    private authService: AuthService,
    private coleccionesService: ColeccionesService
  ) { }

  // async ionViewWillEnter() {
  //   await this.cargarColecciones();
  // }

  async ngOnInit() {
    console.log('ngOnInit Tab2Page');

    this.expansiones = await this.cartasService.expansiones();
    console.log('Expansiones:', this.expansiones);
    this.expansiones_info = await this.cartasService.listar_expansiones();
    console.log('Expansiones info:', this.expansiones_info);
     await this.cargarColecciones();
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

    }
  }

  async mostrarColeccion(nombreColeccion: string) {
    const modal = await this.modalController.create({
      component: ColeccionComponent,
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
    this.colecciones_usuario = snapshot.docs
      .map(doc => {
        const data = { id: doc.id, ...doc.data() };
        // busca la expansión correspondiente en expansiones_info
        const expansion = this.expansiones_info.find(e => e.id === data.id);
        return {
          ...data,
          logo_mediano: expansion ? expansion.logo_mediano : null
        };
      });
    console.log('Colecciones de usuario tab2:', this.colecciones_usuario);
  }
}
