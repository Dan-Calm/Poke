
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.config';

import { getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

import { ColeccionesService } from '../services/colecciones.service';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';



@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,

})

export class AdminPage implements OnInit, OnDestroy {

  @ViewChild('barChart', { static: true }) barChart!: ElementRef;
  @ViewChild('registrosChart', { static: true }) registrosChart!: ElementRef;
  @ViewChild('cartasGuardadasChart', { static: true }) cartasGuardadasChart!: ElementRef;
  
  chart: any;
  registrosChart_instance: any;
  cartasGuardadasChart_instance: any;

  constructor(private coleccionesService: ColeccionesService) {
    Chart.register(...registerables);
  }

  usuarios: any[] = [];
  usuariosAdmin: any[] = [];
  usuariosOnline: number = 0;
  private observador: any;

  textoBusqueda: string = '';
  usuariosFiltrados: any[] = [];

  historiales: any[] = [];
  ranking_historiales: any[] = [];

  // Nuevas propiedades para las estadísticas
  usuariosPremium: number = 0;
  suscripcionesPrimera: number = 0;
  renovacionesSuscripciones: number = 0;
  
  mesSeleccionado: string = '';
  mesesDisponibles: any[] = [];
  registrosPorDia: any[] = [];
  
  cartasGuardadas: any[] = [];
  cartasVariacionPrecio: any[] = [];

  async ngOnInit() {
    const referencia = collection(db, 'usuarios_online');
    this.observador = onSnapshot(referencia, (snapshot) => {
      this.usuariosOnline = snapshot.size;
    });
    
    // Inicializar meses disponibles
    this.inicializarMesesDisponibles();
    
    await this.cargarUsuarios();
    await this.cargarHistoriales();
    await this.cargarEstadisticasPremium();
    await this.cargarCartasGuardadas();
    await this.cargarVariacionesPrecios();
  }
  async cargarHistoriales() {
    this.historiales = await this.coleccionesService.historiales();
    // console.log('Historiales cargados:', this.historiales);
    const conteo: { [id: string]: { count: number, nombre?: string, codigo?: string } } = {};
    for (const historial of this.historiales) {
      for (const carta of historial.cartas) {
        if (!conteo[carta.id]) {
          conteo[carta.id] = { count: 0, nombre: carta.nombre_espanol, codigo: carta.codigo };
        }
        conteo[carta.id].count++;
      }
    }
    const ranking = Object.entries(conteo)
      .map(([id, data]) => ({ id, nombre: data.nombre, codigo: data.codigo, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // console.log('Ranking de cartas más jugadas:', ranking);

    // Crea el gráfico de barras
    this.createBarChart(ranking);
  }

  createBarChart(ranking: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.barChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ranking.map(c => `${c.codigo} - ${c.nombre || c.id}`),
        datasets: [
          {
            label: 'Cantidad',
            data: ranking.map(c => c.count),
            backgroundColor: '#1976d2',
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'Cantidad' }
          },
          y: {
            title: { display: false }
          }
        }
      },
    });
  }

  ngOnDestroy() {
    if (this.observador) {
      this.observador();
    }
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.registrosChart_instance) {
      this.registrosChart_instance.destroy();
    }
    if (this.cartasGuardadasChart_instance) {
      this.cartasGuardadasChart_instance.destroy();
    }
  }

  async cargarUsuarios() {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    this.usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    this.usuariosFiltrados = [...this.usuarios];
    this.usuariosAdmin = this.usuarios.filter(u => u.tipo_usuario === 'admin');
  }

  filtrarUsuarios() {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u =>
      (u.nombre_usuario || '').toLowerCase().includes(texto) ||
      (u.email || '').toLowerCase().includes(texto)
    );
  }

  async eliminarUsuario(usuario: any) {
    if (confirm(`¿Eliminar usuario ${usuario.email}?`)) {
      await deleteDoc(doc(db, 'usuarios', usuario.id));
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      this.usuariosAdmin = this.usuariosAdmin.filter(u => u.id !== usuario.id);
    }
  }

  async hacerAdmin(usuario: any) {
    await updateDoc(doc(db, 'usuarios', usuario.id), { tipo_usuario: 'admin' });
    usuario.tipo_usuario = 'admin';
    this.usuariosAdmin = this.usuarios.filter(u => u.tipo_usuario === 'admin');
  }

  async quitarAdmin(usuario: any) {
    await updateDoc(doc(db, 'usuarios', usuario.id), { tipo_usuario: 'usuario' });
    usuario.tipo_usuario = 'usuario';
    this.usuariosAdmin = this.usuarios.filter(u => u.tipo_usuario === 'admin');
  }

  // Nuevos métodos para las estadísticas adicionales

  inicializarMesesDisponibles() {
    const fechaActual = new Date();
    this.mesesDisponibles = [];
    
    // Generar los últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const year = fecha.getFullYear();
      const month = fecha.getMonth();
      
      this.mesesDisponibles.push({
        value: `${year}-${month + 1}`,
        label: `${this.getNombreMes(month)} ${year}`
      });
    }
    
    // Seleccionar el mes actual por defecto
    this.mesSeleccionado = `${fechaActual.getFullYear()}-${fechaActual.getMonth() + 1}`;
    this.cargarRegistrosPorMes();
  }

  getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  }

  async cargarEstadisticasPremium() {
    try {
      // Contar usuarios premium
      this.usuariosPremium = this.usuarios.filter(u => u.tipo_usuario === 'premium').length;
      
      // Para suscripciones y renovaciones, necesitarías una colección de suscripciones
      // Por ahora, simulamos estos datos basándose en los usuarios premium
      // En una implementación real, tendrías una colección 'suscripciones' con historial
      this.suscripcionesPrimera = Math.floor(this.usuariosPremium * 0.7); // 70% primeras suscripciones
      this.renovacionesSuscripciones = this.usuariosPremium - this.suscripcionesPrimera;
      
    } catch (error) {
      console.error('Error al cargar estadísticas premium:', error);
    }
  }

  async cargarRegistrosPorMes() {
    if (!this.mesSeleccionado) return;
    
    try {
      const [year, month] = this.mesSeleccionado.split('-').map(Number);
      const inicioMes = new Date(year, month - 1, 1);
      const finMes = new Date(year, month, 0);
      
      // Filtrar usuarios por fecha de creación en el mes seleccionado
      const usuariosDelMes = this.usuarios.filter(usuario => {
        if (!usuario.fecha_creacion) return false;
        
        let fechaCreacion: Date;
        if (usuario.fecha_creacion.toDate) {
          fechaCreacion = usuario.fecha_creacion.toDate();
        } else {
          fechaCreacion = new Date(usuario.fecha_creacion);
        }
        
        return fechaCreacion >= inicioMes && fechaCreacion <= finMes;
      });

      // Agrupar por día
      const registrosPorDia: { [key: string]: number } = {};
      const diasDelMes = finMes.getDate();
      
      // Inicializar todos los días del mes con 0
      for (let dia = 1; dia <= diasDelMes; dia++) {
        registrosPorDia[dia.toString()] = 0;
      }
      
      // Contar registros por día
      usuariosDelMes.forEach(usuario => {
        let fechaCreacion: Date;
        if (usuario.fecha_creacion.toDate) {
          fechaCreacion = usuario.fecha_creacion.toDate();
        } else {
          fechaCreacion = new Date(usuario.fecha_creacion);
        }
        const dia = fechaCreacion.getDate().toString();
        registrosPorDia[dia]++;
      });

      this.registrosPorDia = Object.keys(registrosPorDia).map(dia => ({
        dia: parseInt(dia),
        registros: registrosPorDia[dia]
      })).sort((a, b) => a.dia - b.dia);

      this.createRegistrosChart();
    } catch (error) {
      console.error('Error al cargar registros por mes:', error);
    }
  }

  createRegistrosChart() {
    if (this.registrosChart_instance) {
      this.registrosChart_instance.destroy();
    }
    
    this.registrosChart_instance = new Chart(this.registrosChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.registrosPorDia.map(r => `Día ${r.dia}`),
        datasets: [
          {
            label: 'Registros',
            data: this.registrosPorDia.map(r => r.registros),
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Cantidad de Registros' }
          },
          x: {
            title: { display: true, text: 'Día del Mes' }
          }
        }
      }
    });
  }

  async cargarCartasGuardadas() {
    try {
      const todasLasColecciones = await this.coleccionesService.obtenerTodasLasColecciones();
      
      const conteoCartas: { [id: string]: { count: number, nombre?: string, codigo?: string } } = {};
      
      todasLasColecciones.forEach(item => {
        const cartaId = item['id'] || item.cartaId;
        
        if (!conteoCartas[cartaId]) {
          conteoCartas[cartaId] = { 
            count: 0, 
            nombre: item['nombre_espanol'] || item['nombre'] || 'Desconocida',
            codigo: item['codigo'] || 'N/A'
          };
        }
        conteoCartas[cartaId].count++;
      });
      
      this.cartasGuardadas = Object.entries(conteoCartas)
        .map(([id, data]) => ({ 
          id, 
          nombre: data.nombre || 'Desconocida', 
          codigo: data.codigo || 'N/A',
          count: data.count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      this.createCartasGuardadasChart();
    } catch (error) {
      console.error('Error al cargar cartas guardadas:', error);
    }
  }

  createCartasGuardadasChart() {
    if (this.cartasGuardadasChart_instance) {
      this.cartasGuardadasChart_instance.destroy();
    }
    
    this.cartasGuardadasChart_instance = new Chart(this.cartasGuardadasChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.cartasGuardadas.map(c => `${c.codigo} - ${c.nombre}`),
        datasets: [{
          data: this.cartasGuardadas.map(c => c.count),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          }
        }
      }
    });
  }

  async cargarVariacionesPrecios() {
    try {
      const variaciones = await this.coleccionesService.obtenerVariacionesPrecios();
      this.cartasVariacionPrecio = variaciones
        .sort((a, b) => Math.abs(b.variacion) - Math.abs(a.variacion))
        .slice(0, 8);
    } catch (error) {
      console.error('Error al cargar variaciones de precios:', error);
    }
  }

}