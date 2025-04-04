import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})

export class Tab1Page {
  cardData: { title: string; price: string; image: string }[] = []; // Propiedad para almacenar los datos
  searchQuery: string = ''; // Propiedad para almacenar el término de búsqueda

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Opcional: Puedes realizar una búsqueda inicial si lo deseas
    // this.fetchData('gengar');
  }

  searchCards() {
    if (this.searchQuery.trim() === '') {
      console.error('El campo de búsqueda está vacío.');
      return;
    }
    this.fetchData(this.searchQuery);
  }

  fetchData(query: string) {
    const url = `https://an624nb822.execute-api.us-east-1.amazonaws.com/Dev/almacen?q=${encodeURIComponent(query)}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Datos obtenidos:', response);

        // Crear un DOMParser para analizar el HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, 'text/html');

        // Seleccionar los elementos que contienen las cartas
        const cards = doc.querySelectorAll('.card-wrapper');

        this.cardData = []; // Limpiar datos previos

        cards.forEach((card) => {
          const title = card.querySelector('.card__heading a')?.textContent?.trim() || 'Sin título';
          const price = card.querySelector('.price-item--last')?.textContent?.trim() || 'Sin precio';
          let image = card.querySelector('img')?.getAttribute('src') || 'Sin imagen';

          // Asegurarse de que la URL de la imagen sea absoluta
          if (image.startsWith('//')) {
            image = `https:${image}`;
          }

          this.cardData.push({ title, price, image });
        });

        // Mostrar los datos en la consola
        console.log('Cartas encontradas:', this.cardData);
      },
      error: (error) => {
        console.error('Error al obtener los datos:', error);
      },
    });
  }
}