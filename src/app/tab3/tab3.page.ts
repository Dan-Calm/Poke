import { Component, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Chart, registerables } from 'chart.js';
import { CartasService } from '../services/cartas.service';
import zoomPlugin from 'chartjs-plugin-zoom';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  @ViewChild('lineChart', { static: true }) lineChart!: ElementRef;

  id: string | null = null;

  referenciasPrecios: any[] = [];
  cartas_expansiones: any[] = [];
  carta_tiendas: any[] = [];
  carta: any[] = [];

  precio_promedio: string = "0";


  chart: any;

  constructor(private cartasService: CartasService, private route: ActivatedRoute) {

    Chart.register(...registerables, zoomPlugin); // Registrar los componentes de Chart.js

  }

  async ngOnInit() {
    // Obtener el parámetro 'id' de la URL
    this.id = this.route.snapshot.paramMap.get('id');
    console.log('ID recibido:', this.id);
    
    this.cartas_expansiones = await this.cartasService.expansiones();
    this.carta_tiendas = (await this.cartasService.descargarCartasDeTiendas()).filter((carta) => carta.coleccion === this.id);
  
    console.log("Precios de las cartas en la tienda:");
    let totalPrecio = 0;
    for (let index = 0; index < this.carta_tiendas.length; index++) {
      const carta = this.carta_tiendas[index];
      console.log("Carta:", carta);
      console.log(`Carta ${index + 1}: ${carta.id} - Precio: ${carta.precio}`);
      totalPrecio += carta.precio;

      console.log("ID de la tienda:", carta.id_tienda);
      let precios : any [] = [];
      precios = await this.cartasService.consultarPrecios(carta.id, carta.id_tienda);
      this.referenciasPrecios.push(...precios);
    }
    console.log("Precios de las cartas en la tienda:", this.referenciasPrecios);
  
    const promedio = this.carta_tiendas.length > 0 ? totalPrecio / this.carta_tiendas.length : 0;
  
    // Formatear el precio promedio como CLP
    this.precio_promedio = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(promedio);
  
    console.log(`Precio promedio: ${this.precio_promedio}`);
  

    this.carta = this.cartas_expansiones.filter((carta) => carta.id === this.id);

    // console.log("Cartas de la tienda",this.cartas_expansiones);
    this.createLineChart();
  }


  // Crear el gráfico de líneas
  createLineChart() {
    const labels = this.referenciasPrecios.map((ref) => {
      const fecha = new Date(ref.fecha_inicial);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
      const anio = String(fecha.getFullYear()).slice(-2); // Obtener los últimos 2 dígitos del año
      return `${dia}-${mes}-${anio}`;
    }); // Fechas iniciales como etiquetas en formato dd-mm-yy
    const data = this.referenciasPrecios.map((ref) => ref.precio); // Precios como datos

    this.chart = new Chart(this.lineChart.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Precios en el tiempo',
            data: data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          zoom: {
            pan: {
              enabled: true, // Habilitar desplazamiento
              mode: 'x', // Permitir desplazamiento solo en el eje X
            },
            zoom: {
              wheel: {
                enabled: true, // Habilitar zoom con la rueda del ratón
              },
              pinch: {
                enabled: true, // Habilitar zoom con gestos táctiles
              },
              mode: 'x', // Permitir zoom solo en el eje X
            },
          },
        },
        scales: {
          x: {
            title: {
              display: false,
              text: 'Fecha Inicial',
            },
          },
          y: {
            title: {
              display: false,
              text: 'Precio',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}