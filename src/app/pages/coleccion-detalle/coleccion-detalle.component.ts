import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartasService } from '../../services/cartas.service';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-coleccion-detalle',
  templateUrl: './coleccion-detalle.component.html',
  styleUrls: ['./coleccion-detalle.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ColeccionDetalleComponent implements OnInit {
  coleccionId: string = ''; // ID de la colección seleccionada
  cartas: any[] = []; // Cartas de la colección seleccionada

  constructor(
    private route: ActivatedRoute,
    private cartasService: CartasService
  ) { }

  async ngOnInit() {
    // Llamar a la función para cargar las cartas
    await this.cargarCartas();
  }

    openLink(link: string) {
    if (link) {
      window.open(link, '_blank'); // Abrir el enlace en una nueva pestaña
    } else {
      console.error('El enlace no está disponible.');
    }
  }

  private async cargarCartas() {
    // Obtener el ID de la colección desde los parámetros de la ruta
    this.coleccionId = this.route.snapshot.paramMap.get('id') || '';

    // Cargar cartas de ambas colecciones
    const cartasAfkStore = await this.cargarCartasDesdeColeccion('productos_afkstore', 'productos_afkstore');
    const cartasOasisGames = await this.cargarCartasDesdeColeccion('productos_oasisgames', 'productos_oasisgames');

    // Combinar las cartas de ambas colecciones
    const cartasBase = [...cartasAfkStore, ...cartasOasisGames].filter(
      (carta) => carta.coleccion === this.coleccionId
    );

    // Obtener el precio más reciente para cada carta
    this.cartas = await Promise.all(
      cartasBase.map(async (carta) => {
        // Construir dinámicamente la referencia a la subcolección `precios`
        const referenciaPrecios = collection(db, `${carta.origen}/${carta.id}/precios`);
        const consultaPrecioMasReciente = query(
          referenciaPrecios,
          orderBy('fecha_final', 'desc'),
          limit(1)
        );
        const preciosSnapshot = await getDocs(consultaPrecioMasReciente);

        let precioActual = 'No disponible';
        if (!preciosSnapshot.empty) {
          const precioMasReciente = preciosSnapshot.docs[0].data();
          const precio = precioMasReciente['precio'];

          // Formatear el precio como CLP
          precioActual = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
          }).format(precio);
        }

        return {
          ...carta,
          precio: precioActual, // Agregar el precio formateado a la carta
        };
      })
    );

    console.log('Cartas con precios actualizados:', this.cartas);
  }

  // Función para cargar cartas desde una colección específica
  private async cargarCartasDesdeColeccion(coleccionNombre: string, origen: string): Promise<any[]> {
    const referenciaColeccion = collection(db, coleccionNombre);
    const snapshot = await getDocs(referenciaColeccion);

    return snapshot.docs.map((doc) => ({
      id: doc.id, // Este es el ID del documento en Firestore
      origen, // Agregar el origen de la carta
      ...doc.data(),
    }));
  }
}