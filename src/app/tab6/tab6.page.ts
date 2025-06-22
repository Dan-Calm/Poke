import { Component, OnInit } from '@angular/core';
import { ColeccionesService } from '../services/colecciones.service';
import { ModalController } from '@ionic/angular';
import { CompararColeccionesComponent } from '../modales/comparar-colecciones/comparar-colecciones.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab6',
  templateUrl: './tab6.page.html',
  styleUrls: ['./tab6.page.scss'],
  standalone: false, // Comentado si no es un componente standalone
})
export class Tab6Page implements OnInit {

  id_usuario: string = '';
  propias: any[] = [];
  favoritos: any[] = [];
  propias_globales: any[] = [];
  favoritos_globales: any[] = [];

  solicitudes: any[] = [];

  solicitudesSub: Subscription | undefined;

  // Nueva propiedad para almacenar las sugerencias para el HTML
  sugerencias: Array<{
    idUsuario: string;
    nombreOtroUsuario: string; // Para mostrar el nombre en lugar del ID
    yoLeDoy: any[];
    elMeDa: any[];
    email: string; // Agregado para manejar el email si es necesario
  }> = [];

  constructor(
    private coleccionesService: ColeccionesService,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    this.id_usuario = await this.coleccionesService.obtenerIdUsuario();
    await this.cargarColecciones();
    this.sugerirIntercambios();

    // Suscripción en tiempo real
    this.solicitudesSub = this.coleccionesService.solicitudesContactoListener().subscribe(solicitudes => {
      this.solicitudes = solicitudes;
      console.log('Solicitudes de contacto en Tab6 (realtime):', this.solicitudes);
    });
  }

  ngOnDestroy() {
    this.solicitudesSub?.unsubscribe();
  }

  get solicitudesPendientes() {
    return this.solicitudes?.filter(s => s.estado === 'pendiente') || [];
  }

  get solicitudesAprobadas() {
    return this.solicitudes?.filter(s => s.estado === 'aprobado') || [];
  }

  async aceptarSolicitud(solicitud: any) {
    console.log('Solicitud aceptada:', solicitud);
    try {
      await this.coleccionesService.aprobarSolicitudContacto(solicitud.id, solicitud.de);
      // Recargar las solicitudes después de aceptar
      this.solicitudes = await this.coleccionesService.obtenerSolicitudesContacto();
    } catch (error) {
      console.error('Error al aceptar la solicitud:', error);
    }
  }

  async seleccionarSugerencia(sugerencia: any) {

    console.log('Sugerencia seleccionada:', sugerencia);

    const modal = await this.modalCtrl.create({
      component: CompararColeccionesComponent,
      componentProps: {
        miId: this.id_usuario,
        otroId: sugerencia.idUsuario,
        otroUsuario: sugerencia.nombreOtroUsuario,
        otroEmail: sugerencia.email, // Asumiendo que el ID es el email
      }
    });
    await modal.present();
  }

  copiarEmail(email: string) {
    navigator.clipboard.writeText(email).then(() => {
      // Opcional: mostrar un mensaje de éxito
      console.log('Email copiado al portapapeles:', email);
    }).catch(err => {
      console.error('Error al copiar el email:', err);
    });
  }

  async cargarColecciones() {
    this.propias = await this.coleccionesService.cargarCartasDeColeccion("propias");
    this.favoritos = await this.coleccionesService.cargarCartasDeColeccion("favoritos");
    // Los logs extensos de las colecciones completas pueden ser verbosos para el desarrollo diario.
    // console.log('Cartas propias del usuario actual:', this.propias);
    // console.log('Cartas favoritas del usuario actual:', this.favoritos);

    this.propias_globales = await this.coleccionesService.cargarCartasDeColeccionGlobal("propias");
    this.favoritos_globales = await this.coleccionesService.cargarCartasDeColeccionGlobal("favoritos");
    // console.log('Cartas propias de todos los usuarios (globales):', this.propias_globales);
    // console.log('Cartas favoritas de todos los usuarios (globales):', this.favoritos_globales);
  }

  encontrarMatchesDeseados(): any[] {
    if (!this.id_usuario) return [];

    // Crear un Map de cartas propias de otros usuarios por ID
    const cartasPropiasDeOtros = new Map<string, any[]>();
    this.propias_globales.forEach(carta => {
      if (carta.usuarioPropietario !== this.id_usuario) {
        if (!cartasPropiasDeOtros.has(carta.id)) cartasPropiasDeOtros.set(carta.id, []);
        cartasPropiasDeOtros.get(carta.id)!.push(carta);
      }
    });

    // Buscar coincidencias rápidas usando el Map
    const matchesEncontrados: any[] = [];
    this.favoritos.forEach(cartaFavorita => {
      const matches = cartasPropiasDeOtros.get(cartaFavorita.id) || [];
      matches.forEach(match => {
        matchesEncontrados.push({
          cartaDeseadaId: cartaFavorita.id,
          codigo: cartaFavorita.codigo,
          nombreCartaDeseada: cartaFavorita.nombre || cartaFavorita.nombre_espanol,
          usuarioQueLaPoseeId: match.usuarioPropietario,
          detallesCartaPoseidaPorOtro: match,
        });
      });
    });

    return matchesEncontrados;
  }

  encontrarCartasPropiasDeseadasPorOtros(): any[] {
    if (!this.id_usuario) return [];

    // Crear un Map de cartas favoritas de otros usuarios por ID
    const cartasFavoritasDeOtros = new Map<string, any[]>();
    this.favoritos_globales.forEach(carta => {
      if (carta.usuarioPropietario !== this.id_usuario) {
        if (!cartasFavoritasDeOtros.has(carta.id)) cartasFavoritasDeOtros.set(carta.id, []);
        cartasFavoritasDeOtros.get(carta.id)!.push(carta);
      }
    });

    // Buscar coincidencias rápidas usando el Map
    const matchesEncontrados: any[] = [];
    this.propias.forEach(cartaPropia => {
      const matches = cartasFavoritasDeOtros.get(cartaPropia.id) || [];
      matches.forEach(match => {
        matchesEncontrados.push({
          cartaPropiaId: cartaPropia.id,
          nombreCartaPropia: cartaPropia.nombre_espanol || cartaPropia.nombre,
          usuarioQueLaDeseaId: match.usuarioPropietario,
          codigo: cartaPropia.codigo,
          detallesCartaDeseadaPorOtro: match,
        });
      });
    });

    return matchesEncontrados;
  }

  sugerirIntercambios() {
    if (!this.id_usuario) {
      console.error("Error: ID del usuario actual no disponible para sugerir intercambios.");
      this.sugerencias = [];
      return;
    }

    this.sugerencias = [];

    // 1. Agrupa los matches por usuario usando Map para acceso rápido
    const yoLeDoyMap = new Map<string, any[]>(); // usuarioId -> cartas que yo le doy
    const elMeDaMap = new Map<string, any[]>();  // usuarioId -> cartas que él me da
    const nombreUsuarioMap = new Map<string, string>(); // usuarioId -> nombre
    const emailUsuarioMap = new Map<string, string>();


    // Cartas que yo tengo y otros quieren
    this.encontrarCartasPropiasDeseadasPorOtros().forEach(match => {
      const userId = match.usuarioQueLaDeseaId;
      if (!yoLeDoyMap.has(userId)) yoLeDoyMap.set(userId, []);
      yoLeDoyMap.get(userId)!.push(match);
      if (match.detallesCartaDeseadaPorOtro?.nombre_usuario) {
        nombreUsuarioMap.set(userId, match.detallesCartaDeseadaPorOtro.nombre_usuario);
      }
      if (match.detallesCartaDeseadaPorOtro?.email_usuario) {
        emailUsuarioMap.set(userId, match.detallesCartaDeseadaPorOtro.email_usuario);
      }
    });

    // Cartas que yo quiero y otros tienen
    this.encontrarMatchesDeseados().forEach(match => {
      const userId = match.usuarioQueLaPoseeId;
      if (!elMeDaMap.has(userId)) elMeDaMap.set(userId, []);
      elMeDaMap.get(userId)!.push(match);
      if (match.detallesCartaPoseidaPorOtro?.nombre_usuario) {
        nombreUsuarioMap.set(userId, match.detallesCartaPoseidaPorOtro.nombre_usuario);
      }
      if (match.detallesCartaPoseidaPorOtro?.email_usuario) {
        emailUsuarioMap.set(userId, match.detallesCartaPoseidaPorOtro.email_usuario);
      }
    });

    // 2. Solo sugerir si hay reciprocidad (ambos mapas tienen entradas para el usuario)
    Array.from(new Set([...yoLeDoyMap.keys(), ...elMeDaMap.keys()])).forEach(userId => {
      const yoLeDoy = yoLeDoyMap.get(userId) || [];
      const elMeDa = elMeDaMap.get(userId) || [];
      if (yoLeDoy.length > 0 && elMeDa.length > 0) {
        this.sugerencias.push({
          idUsuario: userId,
          nombreOtroUsuario: nombreUsuarioMap.get(userId) || userId,
          email: emailUsuarioMap.get(userId) || '', // Agregar email si es necesario
          yoLeDoy,
          elMeDa
        });
      }
    });

    // Log para depuración
    if (this.sugerencias.length === 0) {
      console.log("No se encontraron sugerencias de intercambio mutuo.");
    } else {
      this.sugerencias.forEach(sug => {
        console.log(`\nUsuario: ${sug.nombreOtroUsuario} (ID: ${sug.idUsuario})`);
        console.log(`  YO OFREZCO (${sug.yoLeDoy.length}):`);
        sug.yoLeDoy.forEach(c => console.log(`    >${c.codigo} - ${c.nombreCartaPropia}`));
        console.log(`  EL/ELLA OFRECE (${sug.elMeDa.length}):`);
        sug.elMeDa.forEach(c => console.log(`    > ${c.codigo} - ${c.nombreCartaDeseada}`));
      });
    }
  }
}