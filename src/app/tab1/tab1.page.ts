import { Component, OnInit } from '@angular/core';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase.config'; // Importa la configuración de Firebase

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  listaDeCartas: {
    nombre: string;
    precioActual: string;
    fechaPrecioActual: string;
    imagen: string;
    link: string;
    tipo_carta: string;
    tienda: string;
    codigo_carta: string;
  }[] = []; // Datos extraídos de Firebase

  constructor() { }

  ngOnInit() {
    this.obtenerCartasDesdeFirebase();
  }

  // Función para obtener las cartas desde Firebase
  async obtenerCartasDesdeFirebase() {
    try {
      const referenciaColeccion = collection(db, 'productos_afkstore'); // Nombre de la colección productos_afkstore
      const resultadoConsulta = await getDocs(referenciaColeccion); // Obtener los documentos de la colección

      // Procesar cada documento
      this.listaDeCartas = await Promise.all(
        resultadoConsulta.docs.map(async (documento) => {
          const datosCarta = documento.data() as {
            nombre: string;
            imagen: string;
            tipo_carta: string;
            link: string;
            tienda: string;
            codigo_carta: string;
          };

          // Obtener el precio más reciente de la subcolección "precios"
          const referenciaPrecios = collection(documento.ref, 'precios');
          const consultaPrecioMasReciente = query(
            referenciaPrecios,
            orderBy('fecha_final', 'desc'),
            limit(1)
          );
          const preciosConsulta = await getDocs(consultaPrecioMasReciente);

          // Extraer el precio más reciente
          let precioActual = 'No disponible';
          let fechaPrecioActual = 'No disponible';
          if (!preciosConsulta.empty) {
            const precioMasReciente = preciosConsulta.docs[0].data() as {
              precio: number; // Cambiar a number para trabajar con el formato
              fecha_final: string;
            };

            precioActual = new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
            }).format(precioMasReciente.precio);
            fechaPrecioActual = precioMasReciente.fecha_final;
          }

          return {
            nombre: datosCarta.nombre,
            imagen: datosCarta.imagen,
            tipo_carta: datosCarta.tipo_carta,
            link: datosCarta.link,
            tienda: datosCarta.tienda,
            codigo_carta: datosCarta.codigo_carta,
            precioActual,
            fechaPrecioActual,
          };
        })
      );

      console.log('Cartas obtenidas desde Firebase:', this.listaDeCartas);
    } catch (error) {
      console.error('Error al obtener las cartas desde Firebase:', error);
    }
  }
}