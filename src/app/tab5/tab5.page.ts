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
  tieneMedallaInvestigador = false;
  tieneMedallaFavoritos = false;
  tieneMedallaVeterano = false;
  tieneMedallaPrimeraCaptura = false;
  progresoLegendaria: number = 0;      // 0 o 1 (o más si quieres mostrar progreso parcial)
  progresoColeccionista: number = 0;   // cantidad de colecciones
  progresoCienCartas: number = 0;      // cantidad de cartas
  progresoInvestigador: number = 0;
  progresoFavoritos: number = 0;    // Progreso del investigador (0-100)
  progresoVeterano: number = 0;
  progresoPrimeraCaptura = 0;      // Progreso del veterano (0-100)

  cantidadSolicitudesContacto: number = 0;


  constructor(
    private authService: AuthService,
    private coleccionesService: ColeccionesService,
    private alertController: AlertController,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    await this.cargarDatosUsuario();
    await this.cargarSolicitudesContacto();
  }

  async cargarSolicitudesContacto() {
    this.cantidadSolicitudesContacto = (await this.coleccionesService.obtenerSolicitudesContacto()).length;
  }

  abrirSolicitudesContacto() {
    // Aquí puedes abrir un modal o navegar a la página de solicitudes de contacto
    // Ejemplo: this.modalCtrl.create({ component: SolicitudesContactoComponent });
    // O simplemente mostrar un alert con la lista
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
    await this.coleccionesService.cargarFechaCreacionUsuario();
    await this.cargarSolicitudesContacto();
    const [
      tieneMedallaCartaLegendaria,
      tieneMedallaColeccionistaVerdadero,
      tieneMedallaCienCartas,
      cantidadColecciones,
      cantidadCartas,
      cantidadLegendarias,
      investigador,
      favoritos,
      veterano,
      primeraCaptura
    ] = await Promise.all([
      this.coleccionesService.evaluarMedallaCartaLegendaria(),
      this.coleccionesService.tieneCincoColecciones(),
      this.coleccionesService.tieneCienCartas(),
      this.coleccionesService.getCantidadColecciones(),
      this.coleccionesService.getCantidadCartas(),
      this.coleccionesService.cantidadCartasLegendarias(),
      this.coleccionesService.evaluarMedallaInvestigador(),
      this.coleccionesService.evaluarMedallaFavoritos(),
      this.coleccionesService.evaluarMedallaVeterano(),
      this.coleccionesService.evaluarMedallaPrimeraCaptura()
    ]);

    this.tieneMedallaCartaLegendaria = tieneMedallaCartaLegendaria;
    this.tieneMedallaColeccionistaVerdadero = tieneMedallaColeccionistaVerdadero;
    this.tieneMedallaCienCartas = tieneMedallaCienCartas;
    this.progresoInvestigador = investigador.progreso;
    this.tieneMedallaInvestigador = investigador.tieneMedalla;
    this.progresoLegendaria = cantidadLegendarias;
    this.progresoColeccionista = cantidadColecciones;
    this.progresoCienCartas = cantidadCartas;
    this.progresoFavoritos = favoritos.progreso;
    this.tieneMedallaFavoritos = favoritos.tieneMedalla;
    this.progresoVeterano = veterano.progreso;
    this.tieneMedallaVeterano = veterano.tieneMedalla;
    this.progresoPrimeraCaptura = primeraCaptura.progreso;
    this.tieneMedallaPrimeraCaptura = primeraCaptura.tieneMedalla;
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
