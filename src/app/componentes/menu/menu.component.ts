import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent {
  @Input() favoritos: any[] = [];
  @Input() historial: any[] = [];
  @Output() eliminarFavoritoEvent = new EventEmitter<string>();
  @Output() irAFavoritosEvent = new EventEmitter<string>();

  constructor(private authService: AuthService, private router: Router) {}

  onMenuOpen() {}
  onMenuClose() {}

  eliminarFavorito(id: string) {
    this.eliminarFavoritoEvent.emit(id);
  }

  irAFavoritos(id: string) {
    this.irAFavoritosEvent.emit(id);
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    console.log('Sesión cerrada');

    this.router.navigate(['/login']);
  }
}