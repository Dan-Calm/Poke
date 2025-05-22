import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ColeccionesService } from '../services/colecciones.service';
import { AlertController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {
  nombreUsuario: string = '';
  fechaCreacion: string = '';
  tipoUsuario: string = '';
  imagenPerfil: string = 'assets/default-avatar.png'; // Opcional si no tienes imagen aún
  tieneMedallaCartaLegendaria: boolean = false;
  tieneMedallaColeccionistaVerdadero = false;
  tieneMedallaCienCartas = false;

  constructor(
    private authService: AuthService,
    private coleccionesService: ColeccionesService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    
    const datos = await this.authService.getDatosUsuario();
    if (datos) {
      this.nombreUsuario = datos.nombre_usuario || 'Sin nombre';
      this.fechaCreacion = new Date(datos.fecha_creacion?.seconds * 1000).toLocaleDateString();
      this.tipoUsuario = datos.tipo_usuario || '';
    }  
  }

  async ionViewWillEnter() {
  this.tieneMedallaCartaLegendaria = await this.coleccionesService.evaluarMedallaCartaLegendaria();
  this.tieneMedallaColeccionistaVerdadero = await this.coleccionesService.tieneCincoColecciones();
  this.tieneMedallaCienCartas = await this.coleccionesService.tieneCienCartas();
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
      'Crea almenos 5 colecciones\n';
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
}
