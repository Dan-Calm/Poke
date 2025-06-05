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

  constructor(
    private coleccionesService: ColeccionesService,
    private modalController: ModalController,
    private authService: AuthService // <--- agrega esto
  ) { }

  async ngOnInit() {
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

  async enviarSolicitudContacto() {
    try {
      // Guarda la solicitud en la colección "solicitudes_contacto" bajo el usuario destino
      const now = new Date();
      await this.coleccionesService.crearSolicitudContacto({
        de: this.miId,
        para: this.otroId,
        fecha: now,
        estado: 'pendiente'
      });
      // Puedes mostrar un toast o alerta aquí si lo deseas
      console.log('Solicitud de contacto enviada');
    } catch (error) {
      console.error('Error al enviar la solicitud de contacto:', error);
    }
  }

  async cerrarModal() {
    this.modalController.dismiss();
  }
}