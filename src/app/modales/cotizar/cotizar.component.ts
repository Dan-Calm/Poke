import { Component, OnInit, Input } from '@angular/core';
import { ModalComponent } from "../../componentes/modal/modal.component";
import { CartasService } from '../../services/cartas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-cotizar',
  templateUrl: './cotizar.component.html',
  styleUrls: ['./cotizar.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CotizarComponent implements OnInit {
  @Input() carta: any;

  cartasTiendas: any[] = [];
  cartas: any[] = [];
  cartasFiltradas: any[] = [];
  idiomasDisponibles: string[] = [];
  idiomaSeleccionado: string = '';

  constructor(private cartasService: CartasService, private modalController: ModalController,) { }

  async ngOnInit() {
    console.log('Carta recibida:', this.carta);

    this.cartasTiendas = await this.cartasService.descargarCartasDeTiendas();
    console.log('Cartas de tiendas:', this.cartasTiendas);

    this.cartas = this.cartasTiendas
      .filter((carta) => carta.coleccion === this.carta.id)
      .sort((a, b) => a.precio - b.precio);

    // Obtener idiomas únicos
    this.idiomasDisponibles = Array.from(new Set(this.cartas.map(c => c.idioma))).filter(Boolean);

    // Inicialmente mostrar todas
    this.cartasFiltradas = [...this.cartas];

    console.log('Cartas de la colección seleccionada:', this.cartas);
  }

  filtrarPorIdioma() {
    if (this.idiomaSeleccionado) {
      this.cartasFiltradas = this.cartas.filter(c => c.idioma === this.idiomaSeleccionado);
    } else {
      this.cartasFiltradas = [...this.cartas];
    }
  }

  openLink(link: string) {
    if (link) {
      window.open(link, '_blank');
    } else {
      console.error('El enlace no está disponible.');
    }
  }

  calcularPrecioPromedio(cartas: any[]): number {
    if (!cartas.length) return 0;
    const suma = cartas.reduce((acc, c) => acc + (Number(c.precio) || 0), 0);
    return Math.round(suma / cartas.length);
  }

  async cerrarModal() {
    this.modalController.dismiss();
  }

  getLogoTienda(carta: any): string {
    // Puedes usar carta.tienda o carta.id_tienda según tu estructura de datos
    const tienda = (carta.tienda || '').toLowerCase();
    if (tienda.includes('afk')) return 'assets/tiendas/afk-store.png';
    if (tienda.includes('oasis')) return 'assets/tiendas/oasis-games.png';
    if (tienda.includes('poke')) return 'assets/tiendas/poke-stop.webp';
    if (tienda.includes('tcg')) return 'assets/tiendas/tcg-match.svg';
    // Default
    return 'assets/placeholder.png';
  }

}