import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ColeccionesService } from '../services/colecciones.service';
import { AlertController, ModalController } from '@ionic/angular';
import { ModalConfiguracionComponent } from '../modales/modal-configuracion/modal-configuracion.component';

@Component({
  standalone: false,
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {
  nombreUsuario: string = '';
  correoUsuario: string = '';
  fechaCreacion: string = '';
  tipoUsuario: string = '';
  imagenPerfil: string = 'assets/default-avatar.png';
  tieneMedallaCartaLegendaria: boolean = false;
  tieneMedallaColeccionistaVerdadero = false;
  tieneMedallaCienCartas = false;
  progresoLegendaria: number = 0;      // 0 o 1 (o más si quieres mostrar progreso parcial)
  progresoColeccionista: number = 0;   // cantidad de colecciones
  progresoCienCartas: number = 0;      // cantidad de cartas

  constructor(
    private authService: AuthService,
    private coleccionesService: ColeccionesService,
    private alertController: AlertController,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    const datos = await this.authService.getDatosUsuario();
    if (datos) {
      this.nombreUsuario = datos.nombre_usuario || 'Sin nombre';
      this.correoUsuario = datos.email || 'Sin correo';
      this.fechaCreacion = datos.fecha_creacion?.seconds
        ? new Date(datos.fecha_creacion.seconds * 1000).toLocaleDateString()
        : '';
      this.tipoUsuario = datos.tipo_usuario || '';
    }
  }

  async ionViewWillEnter() {
    const [
      tieneMedallaCartaLegendaria,
      tieneMedallaColeccionistaVerdadero,
      tieneMedallaCienCartas,
      cantidadColecciones,
      cantidadCartas,
      cantidadLegendarias
    ] = await Promise.all([
      this.coleccionesService.evaluarMedallaCartaLegendaria(),
      this.coleccionesService.tieneCincoColecciones(),
      this.coleccionesService.tieneCienCartas(),
      this.coleccionesService.getCantidadColecciones(),
      this.coleccionesService.getCantidadCartas(),
      this.coleccionesService.cantidadCartasLegendarias()
    ]);

    this.tieneMedallaCartaLegendaria = tieneMedallaCartaLegendaria;
    this.tieneMedallaColeccionistaVerdadero = tieneMedallaColeccionistaVerdadero;
    this.tieneMedallaCienCartas = tieneMedallaCienCartas;

    this.progresoLegendaria = cantidadLegendarias; // 0 o más
    this.progresoColeccionista = cantidadColecciones;
    this.progresoCienCartas = cantidadCartas;
  }

  async mostrarInfoMedalla(medalla: string) {
    let mensaje = '';

    if (medalla === 'legendaria') {
      mensaje =
        '🏅 Carta Legendaria\n\n' +
        'Requisito:\n' +
        'Debes tener al menos una carta con rareza\n' +
        '"Rara Ilustración Especial" o "Rara Híper"\n' +
        'en tu colección propia.';
    }

    if (medalla === 'coleccionista') {
      mensaje =
        '🏅 Coleccionista\n\n' +
        'Requisito:\n' +
        'Crea al menos 5 colecciones\n';
    }

    if (medalla === 'cienCartas') {
      mensaje =
        '🏅 Cien Cartas\n\n' +
        'Requisito:\n' +
        'Debes tener al menos 100 cartas en tu colección propia.';
    }

    const alert = await this.alertController.create({
      header: 'Información de Medalla',
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

  async abrirConfiguracion() {
    const modal = await this.modalCtrl.create({
      component: ModalConfiguracionComponent,
      componentProps: {
        nombreUsuario: this.nombreUsuario,
        correoUsuario: this.correoUsuario
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      if (data.nombre_usuario) this.nombreUsuario = data.nombre_usuario;
      if (data.email) this.correoUsuario = data.email;
    }
  }
}
