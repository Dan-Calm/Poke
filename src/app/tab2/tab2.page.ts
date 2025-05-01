import { Component, OnInit } from '@angular/core';

import { ColeccionesService } from '../services/colecciones.service';
import { AuthService } from '../services/auth.service';
import { CartasService } from '../services/cartas.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  constructor(
    private coleccionesServies: ColeccionesService,
    private cartasService: CartasService,
    private authService: AuthService,
  ) {}

  idUsiuario: any = ''; // ID del usuario logueado
  favoritos: any[] = []; // guarda las cartas de todas las tiendas
  expansiones: any[] = []; // guarda las cartas de todas las tiendas

  async ngOnInit() {
    this.idUsiuario = await this.authService.getCurrentUser(); // obtener el id del usuario logueado
    console.log('ID del usuario:', this.idUsiuario);
    await this.coleccionesServies.cargarColecciones(); // cargar los favoritos del usuario logueado
    this.expansiones = await this.cartasService.expansiones(); // cargar los favoritos del usuario logueado
  }

}
