import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
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
export class Tab3Page implements OnInit {
  @ViewChild('lineChart', { static: true }) lineChart!: ElementRef;

  id: string | null = null; // ID de la colección de la carta, recibido por la ruta

  // Almacena todas las referencias de precios históricos cargadas,
  // cada una con su idioma.
  referenciasPreciosGlobal: any[] = [];

  // Información general de todas las cartas de expansiones (para encontrar la seleccionada)
  cartasExpansiones: any[] = [];
  // Cartas específicas de esta colección que se venden en tiendas
  cartasTiendas: any[] = [];
  // Información detallada de la carta que se está visualizando
  cartaSeleccionada: any[] = []; // Debería ser un solo objeto, pero se filtra a un array

  // Estadísticas de precios para el idioma seleccionado
  precioPromedio: string = "0";
  precioMinimo: number = 0;
  precioMaximo: number = 0;

  chart: any; // Instancia del gráfico de Chart.js

  // Gestión de idiomas
  idiomaSeleccionado: string = ''; // Idioma actualmente elegido por el usuario
  idiomasDisponibles: string[] = []; // Lista de idiomas únicos encontrados en los datos

  constructor(
    private cartasService: CartasService,
    private route: ActivatedRoute
  ) {
    Chart.register(...registerables, zoomPlugin); // Registrar Chart.js y el plugin de zoom
  }

  // Al iniciar la vista, se obtiene el ID de la ruta y se dispara la carga de datos.
  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    console.log('ID de colección recibido de la ruta:', this.id);

    // Carga la información general de la carta (nombre, imagen, etc.)
    await this.cargarInformacionGeneralCarta();

    // Carga las cartas de esta colección que se venden en diferentes tiendas
    await this.cargarCartasDeTiendasPorColeccion();

    // Carga el historial de precios para todas las cartas de tiendas encontradas
    await this.cargarReferenciasDePreciosGlobales();

    // Una vez cargados todos los datos globales, se procesan para el idioma inicial
    this.llenarDatosSimuladosDePrecios('2025-05-01', '2025-06-01', 'Español', 320000, 15000);
    this.llenarDatosSimuladosDePrecios('2025-05-01', '2025-06-01', 'Inglés', 400000, 15000);
    this.procesarDatosParaGrafico();
  }

  // Carga la información básica de la carta seleccionada desde las expansiones.
  async cargarInformacionGeneralCarta() {
    this.cartasExpansiones = await this.cartasService.expansiones();
    // Filtra la carta específica que coincide con el ID de la ruta
    this.cartaSeleccionada = this.cartasExpansiones.filter(
      (carta) => carta.id === this.id
    );
    console.log("Información de la carta seleccionada:", this.cartaSeleccionada[0] || 'No encontrada');
  }

  // Carga las cartas de tiendas que pertenecen a la colección actual (identificada por this.id).
  async cargarCartasDeTiendasPorColeccion() {
    const todasLasCartasDeTiendas = await this.cartasService.descargarCartasDeTiendas();
    this.cartasTiendas = todasLasCartasDeTiendas.filter(
      (carta) => carta.coleccion === this.id
    );
    console.log(`Cartas de tiendas encontradas para la colección ${this.id}:`, this.cartasTiendas.length);
  }

  // Carga el historial de precios para cada carta de tienda y lo almacena en referenciasPreciosGlobal.
  // Cada registro de precio histórico se enriquece con el idioma de la carta de tienda.
  async cargarReferenciasDePreciosGlobales() {
    console.log("Iniciando carga de referencias de precios globales...");
    this.referenciasPreciosGlobal = []; // Limpiar datos previos

    for (const cartaDeTienda of this.cartasTiendas) {
      console.log(`Consultando precios para ${cartaDeTienda.nombre} (${cartaDeTienda.idioma}) de la tienda ${cartaDeTienda.tienda}`);
      // Se asume que consultarPrecios devuelve un array de objetos { fecha_inicial, precio, ... }
      const preciosHistoricos = await this.cartasService.consultarPrecios(
        cartaDeTienda.id, // ID de la carta en la tienda
        cartaDeTienda.id_tienda // ID de la tienda
      );

      // Añadir el idioma de la cartaDeTienda a cada registro de precio histórico
      const preciosConIdioma = preciosHistoricos.map((p: any) => ({
        ...p,
        idioma: cartaDeTienda.idioma, // Se asigna el idioma de la carta de la tienda
      }));
      this.referenciasPreciosGlobal.push(...preciosConIdioma);
    }
    console.log("Total de referencias de precios globales cargadas (todos los idiomas):", this.referenciasPreciosGlobal.length);
  }

  // Orquesta la extracción de idiomas, la selección de un idioma por defecto
  // y la actualización del gráfico.
  procesarDatosParaGrafico() {
    this.extraerIdiomasDisponibles();
    this.seleccionarIdiomaPorDefecto();
    this.actualizarGraficoPorIdioma(); // Esto filtrará y mostrará el gráfico
  }

  // Extrae los idiomas únicos de todas las referencias de precios cargadas.
  extraerIdiomasDisponibles() {
    const idiomas = new Set<string>();
    this.referenciasPreciosGlobal.forEach((ref) => {
      if (ref.idioma) {
        idiomas.add(ref.idioma);
      }
    });
    this.idiomasDisponibles = Array.from(idiomas).sort(); // Ordenar alfabéticamente
    console.log("Idiomas disponibles detectados:", this.idiomasDisponibles);
  }

  // Establece un idioma por defecto para mostrar inicialmente.
  seleccionarIdiomaPorDefecto() {
    if (this.idiomasDisponibles.length > 0) {
      this.idiomaSeleccionado = this.idiomasDisponibles[0];
    } else {
      this.idiomaSeleccionado = ''; // No hay idiomas, no se puede seleccionar
    }
    console.log("Idioma seleccionado por defecto:", this.idiomaSeleccionado || "Ninguno");
  }

  // Se llama cuando el usuario cambia el idioma en el selector del HTML.
  onIdiomaCambiado() {
    console.log("Idioma cambiado por el usuario a:", this.idiomaSeleccionado);
    this.actualizarGraficoPorIdioma();
  }

  // Filtra los datos por el idioma seleccionado, los procesa y actualiza el gráfico.
  actualizarGraficoPorIdioma() {
    if (!this.idiomaSeleccionado) {
      console.warn("No hay idioma seleccionado. Limpiando gráfico.");
      this.limpiarDatosYGrafico();
      return;
    }

    // 1. Filtrar las referencias de precios globales por el idioma actual.
    const referenciasFiltradas = this.referenciasPreciosGlobal.filter(
      (ref) => ref.idioma === this.idiomaSeleccionado
    );
    console.log(`Datos filtrados para el idioma '${this.idiomaSeleccionado}': ${referenciasFiltradas.length} registros.`);

    if (referenciasFiltradas.length === 0) {
      console.warn(`No hay datos de precios para el idioma: ${this.idiomaSeleccionado}. Limpiando gráfico.`);
      this.limpiarDatosYGrafico();
      // Aquí podrías mostrar un mensaje al usuario en la UI.
      return;
    }

    // 2. Procesar los datos filtrados: normalizar fechas, ordenar, eliminar duplicados.
    // Estas funciones operan sobre el array filtrado y devuelven uno nuevo.
    let datosProcesados = this.normalizarFechas(referenciasFiltradas);
    datosProcesados = this.ordenarPorFecha(datosProcesados);
    datosProcesados = this.eliminarDuplicadosDeFecha(datosProcesados);

    // 3. Calcular estadísticas (min, max, promedio) sobre los datos ya procesados.
    this.calcularEstadisticas(datosProcesados);

    // 4. Preparar las etiquetas (fechas formateadas) y los datos (precios) para el gráfico.
    const etiquetasParaGrafico = datosProcesados.map((ref) => {
      const fecha = new Date(ref.fecha_inicial); // fecha_inicial ya es un string normalizado
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = String(fecha.getFullYear()).slice(-2); // Formato DD-MM-AA
      return `${dia}-${mes}-${anio}`;
    });
    const datosDePreciosParaGrafico = datosProcesados.map((ref) => ref.precio);

    // 5. Crear o actualizar el gráfico con los nuevos datos.
    this.renderizarGraficoLinea(etiquetasParaGrafico, datosDePreciosParaGrafico);
  }

  // Limpia las estadísticas y destruye el gráfico existente.
  limpiarDatosYGrafico() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null; // Importante para permitir la recreación del gráfico
    }
    this.precioMinimo = 0;
    this.precioMaximo = 0;
    this.precioPromedio = "0";
    // Si no hay datos, se llama a renderizar con arrays vacíos para limpiar el canvas.
    this.renderizarGraficoLinea([], []);
  }

  // --- Funciones auxiliares para el procesamiento de datos ---

  // Normaliza las fechas en un array de referencias.
  // Convierte Timestamps de Firebase a strings y maneja el caso de fecha_inicio.
  normalizarFechas(referencias: any[]): any[] {
    return referencias.map((ref) => {
      const refCopia = { ...ref }; // Evitar mutar el objeto original directamente
      // Si fecha_inicial no existe pero fecha_inicio sí, usar fecha_inicio.
      if (refCopia.fecha_inicial === undefined && refCopia.fecha_inicio !== undefined) {
        refCopia.fecha_inicial = refCopia.fecha_inicio;
      }
      // Convertir Timestamps a string para fecha_inicial
      if (typeof refCopia.fecha_inicial === 'object' && refCopia.fecha_inicial?.seconds !== undefined) {
        refCopia.fecha_inicial = this.timestampAString(refCopia.fecha_inicial);
      }
      // Convertir Timestamps a string para fecha_final (si se usa en el futuro)
      if (typeof refCopia.fecha_final === 'object' && refCopia.fecha_final?.seconds !== undefined) {
        refCopia.fecha_final = this.timestampAString(refCopia.fecha_final);
      }
      return refCopia;
    });
  }

  // Ordena un array de referencias por fecha_inicial (ascendente).
  ordenarPorFecha(referencias: any[]): any[] {
    // Crear una copia para no mutar el array original si es una referencia compartida.
    return [...referencias].sort((a, b) => {
      // Es crucial que fecha_inicial sea un string de fecha válido o un timestamp convertible.
      const fechaA = new Date(a.fecha_inicial).getTime();
      const fechaB = new Date(b.fecha_inicial).getTime();
      // Manejar fechas inválidas poniéndolas al final o registrando un error.
      if (isNaN(fechaA)) return 1;
      if (isNaN(fechaB)) return -1;
      return fechaA - fechaB;
    });
  }

  // Elimina referencias con la misma fecha_inicial, conservando la primera aparición.
  eliminarDuplicadosDeFecha(referencias: any[]): any[] {
    const fechasVistas = new Set<string>();
    const resultadoUnico: any[] = [];
    for (const ref of referencias) {
      // Solo procesar si fecha_inicial es un string válido y no vacío.
      if (typeof ref.fecha_inicial === 'string' && ref.fecha_inicial.trim() !== '') {
        if (!fechasVistas.has(ref.fecha_inicial)) {
          fechasVistas.add(ref.fecha_inicial);
          resultadoUnico.push(ref);
        }
      } else {
        console.warn("Referencia con fecha_inicial inválida o faltante durante eliminación de duplicados:", ref);
      }
    }
    return resultadoUnico;
  }

  // Calcula y actualiza las propiedades de precioMinimo, precioMaximo y precioPromedio.
  calcularEstadisticas(referenciasProcesadas: any[]) {
    if (referenciasProcesadas.length === 0) {
      this.precioMinimo = 0;
      this.precioMaximo = 0;
      this.precioPromedio = "0"; // O un mensaje como "N/A"
      return;
    }
    const precios = referenciasProcesadas.map((ref) => ref.precio);
    this.precioMinimo = Math.min(...precios);
    this.precioMaximo = Math.max(...precios);

    const sumaPrecios = precios.reduce((acumulador, precioActual) => acumulador + precioActual, 0);
    const promedio = sumaPrecios / precios.length;
    // Formatear el precio promedio como moneda local (CLP en este caso).
    this.precioPromedio = promedio.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // Sin decimales para CLP
      maximumFractionDigits: 0
    });
  }

  // Renderiza el gráfico de línea. Recibe las etiquetas (fechas) y los datos (precios).
  renderizarGraficoLinea(etiquetas: string[], datosDePrecios: number[]) {
    // Destruir el gráfico anterior si existe para evitar conflictos con el canvas.
    if (this.chart) {
      this.chart.destroy();
      this.chart = null; // Marcar como nulo para que se pueda recrear.
    }

    // Si no hay datos (por ejemplo, ningún precio para el idioma seleccionado),
    // no intentar crear el gráfico o mostrar un estado vacío.
    if (etiquetas.length === 0 || datosDePrecios.length === 0) {
      console.log("No hay datos disponibles para renderizar el gráfico para el idioma:", this.idiomaSeleccionado);
      // Aquí podrías limpiar el canvas o mostrar un mensaje.
      // Por ahora, simplemente no se crea el gráfico.
      return;
    }

    this.chart = new Chart(this.lineChart.nativeElement, {
      type: 'line',
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: `Precio (${this.idiomaSeleccionado})`, // Etiqueta dinámica con el idioma
            data: datosDePrecios,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true, // Rellenar el área bajo la línea
            tension: 0.1 // Suavizar ligeramente la línea
          },
          // Línea de referencia para el precio mínimo del idioma actual
          {
            label: 'Precio Mínimo',
            data: Array(datosDePrecios.length).fill(this.precioMinimo),
            borderColor: 'rgba(255, 99, 132, 0.5)', // Color distintivo
            borderDash: [5, 5], // Línea punteada
            pointRadius: 0, // Sin puntos en la línea de referencia
            fill: false,
          },
          // Línea de referencia para el precio máximo del idioma actual
          {
            label: 'Precio Máximo',
            data: Array(datosDePrecios.length).fill(this.precioMaximo),
            borderColor: 'rgba(54, 162, 235, 0.5)', // Otro color distintivo
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true, // El gráfico se ajusta al tamaño del contenedor
        maintainAspectRatio: false, // Permite que el alto se defina por el CSS del div contenedor
        plugins: {
          legend: {
            display: true, // Mostrar la leyenda
            position: 'top', // Posición de la leyenda
          },
          zoom: { // Configuración del plugin de zoom
            pan: {
              enabled: true, // Permitir paneo (arrastrar)
              mode: 'x', // Solo en el eje X
            },
            zoom: {
              wheel: { enabled: true }, // Zoom con la rueda del mouse
              pinch: { enabled: true }, // Zoom con gesto de pellizco (táctil)
              mode: 'x', // Solo zoom en el eje X
            },
          },
        },
        scales: {
          x: { // Configuración del eje X (Fechas)
            title: {
              display: true,
              text: 'Fecha',
            },
          },
          y: { // Configuración del eje Y (Precios)
            title: {
              display: true,
              text: 'Precio CLP',
            },
            beginAtZero: true, // Forzar que el eje Y comience en cero
            // Los valores min y max se ajustarán automáticamente a los datos
            ticks: {
              // Formatear los números del eje Y como moneda CLP.
              callback: function (value: string | number) {
                return Number(value).toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              },
            },
          },
        },
      },
    });
  }

  // Convierte un objeto Timestamp de Firebase a un string de fecha y hora.
  // Formato: YYYY-MM-DD HH:MM:SS
  private timestampAString(ts: any): string {
    // Verificar si 'ts' es realmente un objeto Timestamp de Firebase.
    if (!ts || typeof ts !== 'object' || typeof ts.seconds !== 'number' || typeof ts.nanoseconds !== 'number') {
      // Si ya es un string de fecha válido, devolverlo.
      if (typeof ts === 'string' && !isNaN(new Date(ts).getTime())) {
        return ts;
      }
      // Si no es un Timestamp ni un string de fecha válido, devolver string vacío o manejar error.
      console.warn("Formato de timestamp inválido recibido:", ts);
      return '';
    }
    // Crear un objeto Date a partir de los segundos y nanosegundos.
    const date = new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6));
    // Función interna para asegurar dos dígitos (padding con cero).
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Construir el string de fecha formateado.
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
 * Genera datos de precios simulados entre dos fechas para poblar el gráfico.
 * @param fechaInicio Fecha inicial en formato 'YYYY-MM-DD'
 * @param fechaFin Fecha final en formato 'YYYY-MM-DD'
 * @param idioma Idioma para los datos simulados
 * @param precioBase Precio inicial de referencia
 * @param variacion Máxima variación aleatoria por día
 */
  llenarDatosSimuladosDePrecios(
    fechaInicio: string,
    fechaFin: string,
    idioma: string = 'Español',
    precioBase: number = 300000,
    variacion: number = 20000
  ) {
    const datos: any[] = [];
    let fechaActual = new Date(fechaInicio);
    const fechaLimite = new Date(fechaFin);
    let precio = precioBase;

    while (fechaActual <= fechaLimite) {
      // Simula una variación de precio diaria
      const cambio = Math.floor(Math.random() * variacion * 2) - variacion;
      precio = Math.max(10000, precio + cambio); // Nunca menor a 10.000

      // Formatea la fecha a 'YYYY-MM-DD HH:mm:ss'
      const pad = (n: number) => n.toString().padStart(2, '0');
      const fechaStr = `${fechaActual.getFullYear()}-${pad(fechaActual.getMonth() + 1)}-${pad(fechaActual.getDate())} 12:00:00`;

      datos.push({
        id: `simulado_${fechaStr}`,
        precio: precio,
        fecha_inicial: fechaStr,
        fecha_final: fechaStr,
        idioma: idioma,
        precio_str: precio.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }),
      });

      // Avanza un día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Agrega los datos simulados al arreglo global
    this.referenciasPreciosGlobal.push(...datos);
  }
}