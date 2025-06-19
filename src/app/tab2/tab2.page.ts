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
    await this.cargarColecciones();

    if (data) {
      console.log('Expansión seleccionada:', data);
      // Mostrar toast de confirmación
      const toast = document.createElement('ion-toast');
      toast.message = 'Expansión agregada correctamente';
      toast.duration = 1000;
      toast.color = 'success';
      document.body.appendChild(toast);
      await toast.present();
    }
  }

  async mostrarColeccion(coleccion: any) {
    console.log('Mostrar colección:', coleccion);
    const modal = await this.modalController.create({
      component: ColeccionComponent,
      componentProps: {
        coleccion: coleccion
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

    this.colecciones_usuario = this.colecciones_usuario.sort((a, b) => {
      const orden = ['propias', 'favoritos', 'historial'];
      const idxA = orden.indexOf(a.id);
      const idxB = orden.indexOf(b.id);
    
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB; // Ambos están en el orden, ordenar por índice
      }
      if (idxA !== -1) return -1; // a está en el orden, va antes
      if (idxB !== -1) return 1;  // b está en el orden, va antes
      return 0; // Ninguno está en el orden, mantener su posición relativa
    });
  }
}
