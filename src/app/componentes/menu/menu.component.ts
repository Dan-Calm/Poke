import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common'; // <-- importa CommonModule

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule] // <-- agrega CommonModule aquí
})
export class MenuComponent {
  @Input() favoritos: any[] = [];
  @Input() historial: any[] = [];
  @Output() eliminarFavoritoEvent = new EventEmitter<string>();
  @Output() irAFavoritosEvent = new EventEmitter<string>();

  onMenuOpen() {}
  onMenuClose() {}

  eliminarFavorito(id: string) {
    this.eliminarFavoritoEvent.emit(id);
  }

  irAFavoritos(id: string) {
    this.irAFavoritosEvent.emit(id);
  }
}