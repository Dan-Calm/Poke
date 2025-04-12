import { Component, OnInit } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../config/firebase.config'; // Importa la configuración de Firebase

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  listaDeCartas: { nombre: string; precio: string; disponibilidad: string; imagen: string }[] = []; // Datos extraídos de Firebase

  constructor() {}

  ngOnInit() {
    this.obtenerCartasDesdeFirebase();
  }

  // Función para obtener las cartas desde Firebase
  async obtenerCartasDesdeFirebase() {
    try {
      const referenciaColeccion = collection(db, 'productos_afkstore'); // Nombre de la colección productos_afkstore
      const resultadoConsulta = await getDocs(referenciaColeccion); // Obtener los documentos de la colección
      this.listaDeCartas = resultadoConsulta.docs.map((documento) => 
        documento.data() as { nombre: string; precio: string; disponibilidad: string; imagen: string }
      );
      console.log('Cartas obtenidas desde Firebase:', this.listaDeCartas);
    } catch (error) {
      console.error('Error al obtener las cartas desde Firebase:', error);
    }
  }
}