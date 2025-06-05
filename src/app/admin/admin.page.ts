
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.config';

import { getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  chart: any;

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

  async ngOnInit() {
    const referencia = collection(db, 'usuarios_online');
    this.observador = onSnapshot(referencia, (snapshot) => {
      this.usuariosOnline = snapshot.size;
    });
    await this.cargarUsuarios();

    this.cargarHistoriales();
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




}