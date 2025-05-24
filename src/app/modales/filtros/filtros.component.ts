import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importar FormsModule para usar ngModel
import { IonicModule, ModalController } from '@ionic/angular';
import { ColeccionesService } from '../../services/colecciones.service';
import { CartasService } from '../../services/cartas.service'; // Importar el servicio de cartas
import { ModalComponent } from '../../componentes/modal/modal.component';

@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.component.html',
  styleUrls: ['./filtros.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ModalComponent], // Agregar ModalComponent aquí
})
export class FiltrosComponent {

  @Input() filtros: any; // <-- Recibe los filtros desde el modal


  rareza_seleccionada: string = '';
  tipos_carta_seleccionada: string[] = []; // Permitir selección múltiple

  nivelesSeleccionados: string[] = [];
  rarezasSeleccionados: string[] = [];

  expansiones: any[] = []; // Guarda las expansiones del usuario logueado
  expansiones_filtradas: any[] = []; // Guarda las expansiones del usuario logueado
  niveles: any[] = [];
  rarezas: any[] = [];
  tipos_carta: any[] = [];

  lista_expansiones: any[] = []; // Almacena el listado de iconos
  lista_iconos: any[] = []; // Almacena el listado de iconos

  expansiones_agrupadas: any[] = []; // Almacena los nombres de las expansiones
  generaciones_unicas: any[] = []; // Almacena los nombres de las expansiones
  expansiones_unicas: any[] = []; // Almacena los nombres de las expansiones
  expansiones_unicas_id: any[] = []; // Almacena los nombres de las expansiones
  expansiones_unicas_filtradas: any[] = []; // Almacena los nombres de las expansiones
  generaciones_seleccionadas: string[] = []; // Almacena los nombres de las expansiones seleccionadas
  expansiones_seleccionadas: string[] = []; // Almacena los nombres de las expansiones seleccionadas


  constructor(
    private modalController: ModalController,
    private coleccionesServies: ColeccionesService,
    private cartasService: CartasService
  ) { }


  async ngOnInit() {

    if (this.filtros) {
      this.nivelesSeleccionados = this.filtros.niveles || [];
      this.rareza_seleccionada = this.filtros.rarezas || '';
      this.tipos_carta_seleccionada = this.filtros.tipos_carta || [];
      this.generaciones_seleccionadas = this.filtros.generaciones || [];
      this.expansiones_seleccionadas = this.filtros.expansiones || [];
    }
    await this.listar_expansiones(); // Cargar las expansiones del usuario logueado

    this.expansiones = await this.cartasService.expansiones(); // Cargar las expansiones del usuario logueado
    // console.log('Expansiones:', this.expansiones);
    this.cargar_listas(); // Cargar los niveles del usuario logueado
    this.lista_iconos = await this.cartasService.cargar_iconos(); // Cargar los íconos del usuario logueado
    // console.log('Iconos:', this.lista_iconos);

  }

  async listar_expansiones() {
    this.lista_expansiones = await this.cartasService.listar_expansiones(); // Cargar las expansiones del usuario logueado
    console.log('Listado de Expansiones:', this.lista_expansiones);


    this.expansiones_agrupadas = this.lista_expansiones.map((expansion) => {
      // console.log('Generacion:', expansion.nombre_generacion);
      // console.log('Expansion:', expansion.nombre_expansion);
      return {
        nombre_generacion: expansion.nombre_generacion,
        nombre_expansion: expansion.nombre_expansion,
      };
    });

    // Guardar valores únicos de generaciones y extensiones
    this.generaciones_unicas = Array.from(
      new Set(this.expansiones_agrupadas.map((item) => item.nombre_generacion))
    ).filter((generacion) => generacion); // Filtrar generaciones únicas y no indefinidas

    this.expansiones_unicas = Array.from(
      new Set(this.expansiones_agrupadas.map((item) => item.nombre_expansion))
    ).filter((expansion) => expansion); // Filtrar extensiones únicas y no indefinidas

    // Crear lista de IDs de expansiones
    this.expansiones_unicas_id = this.lista_expansiones.map(exp => exp.id);
    console.log('IDs de expansiones:', this.expansiones_unicas_id);

    this.expansiones_unicas_filtradas = this.expansiones_unicas;

    console.log('Generaciones seleccionadas:', this.generaciones_unicas);
    console.log('Extensiones seleccionadas:', this.expansiones_unicas);
    console.log('ID Expansiones seleccionadas:', this.expansiones_unicas_id);
    console.log('Expansiones unicas filtradas:', this.expansiones_unicas_filtradas);
  }

  filtrar_extensiones(event: CustomEvent) {
    console.log('ionChange fired with value: ' + event.detail.value);
    const valores_seleccionados = event.detail.value;
    console.log('Valor seleccionado:', valores_seleccionados);

    // Filtrar las expansiones según las generaciones seleccionadas
    if (valores_seleccionados.length === 0) {
      // Si no hay generaciones seleccionadas, mostrar todas las expansiones
      this.expansiones_unicas_filtradas = this.expansiones_agrupadas.map((expansion) => expansion.nombre_expansion);
    } else {
      // Filtrar las expansiones que pertenecen a las generaciones seleccionadas
      this.expansiones_unicas_filtradas = this.expansiones_agrupadas
        .filter((expansion) => valores_seleccionados.includes(expansion.nombre_generacion))
        .map((expansion) => expansion.nombre_expansion);
    }

    console.log('Expansiones únicas filtradas:', this.expansiones_unicas_filtradas);
  }

  async cargar_listas() {

    console.log('Cargando listas de filtros...');
    console.log('Expansiones:', this.expansiones);

    // Filtra las expansiones que están en la lista de expansiones_unicas_filtradas
    this.expansiones_filtradas = this.expansiones.filter(exp =>
      this.expansiones_unicas_filtradas.includes(exp.expansion)
    );
    console.log('Expansiones filtradas:', this.expansiones_filtradas);
    this.niveles = Array.from(
      new Set(this.expansiones.map((expansion) => expansion.categoria))
    ).filter((categoria) => categoria); // Filtrar niveles únicos y no indefinidos
    console.log('Niveles:', this.niveles);

    this.rarezas = Array.from(
      new Set(this.expansiones.map((expansion) => expansion.rareza))
    ).filter((rareza) => rareza); // Filtrar rarezas únicas y no indefinidas
    console.log('Rareza:', this.rarezas);

    this.tipos_carta = Array.from(
      new Set(this.expansiones.map((expansion) => expansion.tipo_carta))
    ).filter((tipo_carta) => tipo_carta); // Filtrar tipos de carta únicos y no indefinidos
    console.log('Tipos carta:', this.tipos_carta);
  }

  cerrarModal() {
    this.modalController.dismiss();
  }

  aplicarFiltros() {
    console.log('Niveles seleccionados:', this.nivelesSeleccionados); // Imprimir los niveles seleccionados
    this.modalController.dismiss({
      niveles: this.nivelesSeleccionados, // Enviar los niveles seleccionados
      rarezas: this.rareza_seleccionada,
      tipos_carta: this.tipos_carta_seleccionada,
      generaciones: this.generaciones_seleccionadas,
      expansiones: this.expansiones_seleccionadas,
    });
  }
}