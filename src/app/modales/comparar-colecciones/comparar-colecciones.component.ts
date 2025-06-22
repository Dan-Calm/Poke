import { Component, Input, OnInit } from '@angular/core';
import { ColeccionesService } from '../../services/colecciones.service'
import { AuthService } from '../../services/auth.service'; // Asegúrate de importar el servicio


import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-comparar-colecciones',
  templateUrl: './comparar-colecciones.component.html',
  styleUrls: ['./comparar-colecciones.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CompararColeccionesComponent implements OnInit {

  @Input() miId!: string;
  @Input() otroId!: string;

  propias: any[] = [];
  propiasMostradas: any[] = [];
  otrasPropias: any[] = [];
  otrasFavoritos: any[] = [];

  misDatosUsuario: any;
  otroDatosUsuario: any;

  constructor(
    private coleccionesService: ColeccionesService,
    private modalController: ModalController,
  ) { }

  async ngOnInit() {

    console.log('miId:', this.miId);
    console.log('otroId:', this.otroId);

    this.misDatosUsuario = await this.coleccionesService.obtenerDatosUsuarioPorId(this.miId);
    this.otroDatosUsuario = await this.coleccionesService.obtenerDatosUsuarioPorId(this.otroId);

    console.log('Datos del usuario actual:', this.misDatosUsuario);
    console.log('Datos del otro usuario:', this.otroDatosUsuario);

    console.log('Mi ID:', this.miId, '| ID del otro usuario:', this.otroId);
    this.propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    console.log('Cartas propias del usuario actual:', this.propias);
    this.otrasPropias = await this.coleccionesService.cargarCartasDeColeccion("propias", this.otroId);
    console.log('Cartas propias del otro usuario:', this.otrasPropias);
    this.otrasFavoritos = await this.coleccionesService.cargarCartasDeColeccion("favoritos", this.otroId);
    console.log('Cartas favoritas del otro usuario:', this.otrasFavoritos);

    // Filtrar propias para mostrar solo las que están en otrasFavoritos
    const favoritosIds = new Set(this.otrasFavoritos.map(c => c.id));
    this.propiasMostradas = this.propias.filter(carta => favoritosIds.has(carta.id));
  }

  ionViewWillEnter() {
    // Aquí puedes poner lógica que quieras ejecutar justo antes de mostrar el modal
    console.log('El modal de comparar colecciones está a punto de mostrarse');
  }

  async enviarSolicitudContacto() {
    try {
      // Guarda la solicitud en la colección "solicitudes_contacto" bajo el usuario destino
      const now = new Date();
      await this.coleccionesService.crearSolicitudContacto({
        de: this.miId,
        nombre_de: this.misDatosUsuario.nombre_usuario, // Nombre del usuario actual
        email_de: this.misDatosUsuario.email, // Email del usuario actual
        para: this.otroDatosUsuario.id,
        nombre_para: this.otroDatosUsuario.nombre_usuario, // Nombre del otro usuario
        email_para: this.otroDatosUsuario.email, // Email del otro usuario
        fecha: now,
        estado: 'pendiente'
      });
      // 
      console.log('Solicitud de contacto enviada');
      // Cierra el modal después de enviar la solicitud
      this.cerrarModal();
    } catch (error) {
      console.error('Error al enviar la solicitud de contacto:', error);
    }
  }

  async cerrarModal() {
    this.modalController.dismiss();
  }
}