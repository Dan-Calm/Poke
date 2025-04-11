import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  datosCartas: { titulo: string; precio: string; imagen: string; enlace: string; sku: string; tienda: string }[] = [];
  cartasAgrupadas: { sku: string; titulo: string; imagen: string; precioPromedio: string }[] = [];
  cartasPorSku: { [sku: string]: { titulo: string; precio: string; imagen: string; enlace: string; tienda: string }[] } = {};

  terminoBusqueda: string = '';

  cartasFiltradas: { titulo: string; precio: string; imagen: string; enlace: string; tienda: string }[] = [];

  mostrarCartasAgrupadas: boolean = true; // Controla si se muestran las cartas agrupadas

  constructor(private http: HttpClient) { }

  ngOnInit() {
    // this.buscarCartas();
  }

  abrirEnlaceCarta(enlace: string) {
    window.open(enlace, '_blank');
  }

  // Función para iniciar la búsqueda
  buscarCartas() {
    if (this.terminoBusqueda.trim() === '') {
      console.error('El campo de búsqueda está vacío.');
      return;
    }

    // Limpiar datos previos
    this.datosCartas = [];
    this.cartasAgrupadas = [];
    this.cartasPorSku = {};

    // Crear promesas para ambas funciones
    const promesaAFKStore = this.obtenerDatosAFKStore(this.terminoBusqueda);
    const promesaTCGMatch = this.obtenerDatosTCGMatch(this.terminoBusqueda);
    // const promesaOasis = this.obtenerDatosOasis(this.terminoBusqueda);

    // Esperar a que ambas funciones terminen
    Promise.all([promesaAFKStore]).then(() => {
      console.log('Cartas ordenadas:', this.datosCartas);

      // Agrupar cartas por SKU
      this.agruparCartasPorSku();
    });
  }

obtenerDatosOasis(valor: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `https://an624nb822.execute-api.us-east-1.amazonaws.com/Dev/canal-distribucion?q=${encodeURIComponent(valor)}`;

    this.http.get(url, { responseType: 'json' }).subscribe({
      next: (respuesta: any) => {
        // Verificar si la respuesta contiene el campo "productVariants"
        const variantes = respuesta?.searchResult?.productVariants || [];

        // Transformar las variantes en el formato necesario
        const cartasTransformadas = variantes.map((variante: any) => {
          // Extraer el SKU del título si no está definido
          let sku = variante.sku;
          if (!sku || sku === 'Sin SKU') {
            const skuMatch = variante.product?.title?.match(/(\d+\/\d+|\d{3,}\/\d{3,})/);
            sku = skuMatch ? skuMatch[0] : 'Sin SKU';
          }

          return {
            titulo: variante.product?.title || 'Sin título',
            precio: `${variante.price?.amount || 0} ${variante.price?.currencyCode || 'CLP'}`,
            imagen: variante.image?.src ? `https:${variante.image.src}` : 'Sin imagen',
            enlace: `https://www.oasisgames.cl${variante.product?.url || ''}`,
            sku: sku,
            tienda: 'Oasis Games',
          };
          
        });

        // Agregar las cartas transformadas al arreglo datosCartas
        this.datosCartas = [...this.datosCartas, ...cartasTransformadas];

        console.log('Cartas procesadas y agregadas desde Oasis Games:', cartasTransformadas);
        resolve();
      },
      error: (error) => {
        console.error('Error al obtener los datos de Oasis Games:', error);
        reject(error);
      },
    });
  });
}

  // Función para agrupar cartas por SKU
  agruparCartasPorSku() {
    const agrupadas: { [sku: string]: { titulo: string; precio: string; imagen: string; enlace: string; tienda: string }[] } = {};

    // Agrupar cartas por SKU
    this.datosCartas.forEach((carta) => {
      if (!agrupadas[carta.sku]) {
        agrupadas[carta.sku] = [];
      }
      agrupadas[carta.sku].push(carta);
    });

    // Calcular promedio de precios y seleccionar una carta representativa
    this.cartasAgrupadas = Object.keys(agrupadas).map((sku) => {
      const cartas = agrupadas[sku];
      const precioPromedio =
        cartas.reduce((total, carta) => total + parseFloat(carta.precio.replace(' CLP', '')), 0) / cartas.length;

      return {
        sku,
        titulo: cartas[0].titulo, // Usar el título de la primera carta como representativo
        imagen: cartas[0].imagen, // Usar la imagen de la primera carta como representativa
        precioPromedio: `${precioPromedio.toFixed(0)} CLP`, // Promedio de precios
      };
    });

    // Guardar las cartas agrupadas por SKU
    this.cartasPorSku = agrupadas;

    console.log('Cartas agrupadas:', this.cartasAgrupadas);
    console.log('Cartas por SKU:', this.cartasPorSku);
  }

  // Función para obtener datos desde TCG Match
  obtenerDatosTCGMatch(valor: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://an624nb822.execute-api.us-east-1.amazonaws.com/Dev/centros?q=${valor}`;

      this.http.get(url, { responseType: 'json' }).subscribe({
        next: (respuesta: any) => {
          const items = respuesta?.pageProps?.items || [];

          const cartasTransformadas = items.map((item: any) => {
            let imagenUrl = item.card?.data?.images?.small;

            if (!imagenUrl && item.images?.length > 0) {
              imagenUrl = item.images[0]?.url;
            }

            return {
              titulo: `${item.name} - ${item.sku}`,
              precio: `${item.price} CLP`,
              imagen: imagenUrl,
              enlace: `https://tcgmatch.cl/producto/${item._id}`,
              sku: item.sku || 'Sin SKU',
              tienda: 'TCG Match',
            };
          });

          this.datosCartas = [...this.datosCartas, ...cartasTransformadas];
          resolve();
        },
        error: (error) => {
          console.error('Error al obtener los datos de TCG Match:', error);
          reject(error);
        },
      });
    });
  }

  // Función para obtener datos desde AFK Store
  obtenerDatosAFKStore(valor: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://an624nb822.execute-api.us-east-1.amazonaws.com/Dev/almacen?q=${valor}`;

      this.http.get(url, { responseType: 'text' }).subscribe({
        next: (respuesta) => {
          const inicioJson = respuesta.indexOf('webPixelsManagerAPI.publish("search_submitted",');
          const cadenaJson = respuesta.substring(
            respuesta.indexOf('{', inicioJson),
            respuesta.indexOf('});', inicioJson) + 1
          );

          const resultadoBusqueda = JSON.parse(cadenaJson);
          const variantes = resultadoBusqueda?.searchResult?.productVariants || [];

          const cartasTransformadas = variantes
            .filter((variante: any) => variante.product?.type === 'Single')
            .map((variante: any) => {
              // Usar el SKU existente o intentar extraerlo del título
              const sku = variante.sku || (variante.product?.title?.match(/(?:\s|^)([A-Z]*\d+\/?\d*)(?:\s|$)/)?.[1] || 'Sin SKU');

              return {
                titulo: variante.product?.title,
                precio: `${variante.price?.amount} ${variante.price?.currencyCode}`,
                imagen: variante.image?.src ? `https:${variante.image.src}` : 'Sin imagen',
                enlace: `https://www.afkstore.cl${variante.product?.url}`,
                sku: sku,
                tienda: 'AFK Store',
              };
            });

          this.datosCartas = [...this.datosCartas, ...cartasTransformadas];
          resolve();
        },
        error: (error) => {
          console.error('Error al obtener los datos de AFK Store:', error);
          reject(error);
        },
      });
    });
  }

abrirCartasPorSku(sku: string) {
  // Filtrar las cartas correspondientes al SKU seleccionado
  this.cartasFiltradas = this.cartasPorSku[sku] || [];
  this.mostrarCartasAgrupadas = false; // Ocultar las cartas agrupadas
  console.log('Cartas para el SKU seleccionado:', this.cartasFiltradas);
}

volverALaVistaAgrupada() {
  // Volver a mostrar las cartas agrupadas
  this.cartasFiltradas = [];
  this.mostrarCartasAgrupadas = true;
}
}