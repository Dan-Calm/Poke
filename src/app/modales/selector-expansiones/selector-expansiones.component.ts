import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { CartasService } from 'src/app/services/cartas.service';
import { ColeccionesService } from 'src/app/services/colecciones.service';

@Component({
  standalone: true,
  selector: 'app-selector-expansiones',
  templateUrl: './selector-expansiones.component.html',
  styleUrls: ['./selector-expansiones.component.scss'],
  imports: [CommonModule, IonicModule],
})
export class SelectorExpansionesComponent {

  @Input() expansiones: any[] = [];
  expansiones_combinadas: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private cartasService: CartasService,
    private coleccionesService: ColeccionesService
  ) { }

  async ngOnInit() {

    // Combina nombre e id en una sola lista de objetos
    this.expansiones_combinadas = Array.from(
      new Set(this.expansiones.map(expansion => expansion.coleccion))
    ).map(id => {
      const expansion = this.expansiones.find(exp => exp.coleccion === id);
      return { nombre: expansion.expansion, id: expansion.coleccion };
    });

    console.log("expansiones_combinadas", this.expansiones_combinadas); // Lista combinada con nombre e id
  }

  cerrar() {
    this.modalCtrl.dismiss(); // Cierra sin seleccionar nada
  }
  async seleccionarExpansion(expansion: any) {
    console.log('Expansión seleccionada:', expansion);
    console.log('Nombre de la expansión:', expansion.id);

    // console.log("Expansiones", this.expansiones); // Lista de expansiones

    const expansionSeleccionada = this.expansiones.filter(exp => exp.coleccion === expansion.id);
    console.log("Expansion seleccionada", expansionSeleccionada); // Lista de cartas de la expansión seleccionada

    this.coleccionesService.completarColeccion(expansion)
    // this.modalCtrl.dismiss(); // cierra el modal
  }
}
