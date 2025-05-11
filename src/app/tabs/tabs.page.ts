import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  mostrarTab4: boolean = false; // Controla la visibilidad del botón de Tab4

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    const rol = await this.authService.getRol(); // Obtener el rol del usuario
    this.mostrarTab4 = rol === 'administrador'; // Mostrar Tab4 solo si el rol es "administrador"
  }
}