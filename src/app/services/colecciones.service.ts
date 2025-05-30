import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { AuthService } from '../services/auth.service';
import { race } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ColeccionesService {

  idUsuarios: any = ''; // ID del usuario logueado
  favoritos: any[] = []; // guarda los favoritos del usuario logueado
  historial: any[] = []; // guarda los favoritos del usuario logueado
  expansiones: any[] = []; // guarda las expansiones

  colecciones: any[] = []; // guarda las cartas de todas las tiendas

  constructor(private authService: AuthService) { }

  async ngOnInit() {

  }


  async cargarColecciones() {
    try {
      await this.obtenerIdUsuario(); // obtener el id del usuario logueado
      const referenciaFavoritos = collection(db, 'usuarios', this.idUsuarios, 'colecciones');
      console.log('ID del usuario DE LAS COLECCIONES:', this.idUsuarios);
      console.log('Referencia de colecciones ESTE SI:', referenciaFavoritos);
      const resultadoFavoritos = await getDocs(referenciaFavoritos);

      this.colecciones = resultadoFavoritos.docs.map(async (tiendaDoc) => {
        const tiendaId = tiendaDoc.id;
        const referenciaProductos = collection(db, `usuarios/${this.idUsuarios}/colecciones/${tiendaId}/cartas`);
        const resultadoProductos = await getDocs(referenciaProductos);

        // console.log(`Productos de la tienda ${tiendaId}:`, resultadoProductos.docs.map(doc => doc.data()));

        const cartas = resultadoProductos.docs.map((productoDoc) => ({
          id: productoDoc.id,
          tienda: tiendaId,
          ...productoDoc.data(),
        }));

        return cartas;
      });
      // console.log('Favoritos encontrados:', resultadoFavoritos.docs.map(doc => doc.id));


    } catch (error) {
      console.error('Error al cargar los documentos de favoritos:', error);
      throw error;
    }
  }

  async cargarHistorial(): Promise<any[]> {
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    try {
      const referenciaColecciones = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'historial', 'cartas');
      const resultadoColecciones = await getDocs(referenciaColecciones);
      this.favoritos = resultadoColecciones.docs.map(doc => doc.data());

      // console.log('HISTORIAL ENCONTRADO:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async cargarFavoritos(): Promise<any[]> {
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    try {
      if(this.favoritos.length > 0) {
        // console.log('Ya tienes favoritos cargados');
        return this.favoritos;
      }
      return this.recargarFavoritos();
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async recargarFavoritos(): Promise<any[]> {
    try {
      const referenciaColecciones = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'favoritos', 'cartas');
      const resultadoColecciones = await getDocs(referenciaColecciones);
      this.favoritos = resultadoColecciones.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // console.log('Carga de favoritos desde colecciones service:', this.favoritos);
      return this.favoritos;
    } catch (error) {
      console.error('Error al cargar los favoritos:', error);
      throw error;
    }
  }

  async agregar_a_coleccion(carta: any, nombre_coleccion: string): Promise<boolean> {
    console.log('Agregar a Favorito carta con ID:', carta.id);
    await this.obtenerIdUsuario(); // obtener el id del usuario logueado
    console.log('ID del usuario:', this.idUsuarios);
    console.log('Carta: ', carta);

    try {
      const ref_favoritos = doc(db, 'usuarios', this.idUsuarios, 'colecciones', nombre_coleccion);
      await setDoc(ref_favoritos, {
        nombre: nombre_coleccion,
      }, { merge: true });

      const referencia_documento = doc(db, 'usuarios', this.idUsuarios, 'colecciones', nombre_coleccion, 'cartas', carta.id);
      await setDoc(referencia_documento, {
        id: carta.id,
        nombre_espanol: carta.nombre_espanol,
        codigo: carta.codigo,
        imagen_url: carta.imagen_url,
        imagen_url_grande: carta.imagen_url_grande,
        rareza: carta.rareza,
        estado: carta.estado,
        expansion: carta.expansion,
        coleccion: carta.coleccion,
        tipo_carta: carta.tipo_carta,

      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error al cargar los documentos de favoritos:', error);
      throw error;
    }
  }

  async listaFavoritos(): Promise<any[]> {
    if (this.favoritos.length > 0) {
      return this.favoritos;
    } else {
      return await this.cargarFavoritos();
    }
  }

  async obtenerIdUsuario() {
    try {
      if (this.idUsuarios) {
        // console.log('ID del usuario desde colecciones services:', this.idUsuarios);
        return this.idUsuarios;
      } else {
        this.idUsuarios = await this.authService.getCurrentUser();
        return this.idUsuarios;
      }
    } catch (error) {
      console.error('Error al obtener el ID del usuario:', error);
    }
  }

  async cargarExpansiones(): Promise<any[]> {
    try {
      const referenciaExpansiones = collection(db, 'expansiones');
      const resultado = await getDocs(referenciaExpansiones);
      this.expansiones = resultado.docs.map(doc => doc.data());

      console.log('Expansiones encontradas:', this.expansiones);
      return this.expansiones;
    } catch (error) {
      console.error('Error al cargar las expansiones:', error);
      throw error;
    }
  }

  // =====================================================
  async completarColeccion(expansion_seleccionada: { id: string, nombre: string }): Promise<void> {
    await this.obtenerIdUsuario();
    console.log('ID del usuario:', this.idUsuarios);
    console.log('Expansion seleccionada:', expansion_seleccionada.id);

    const id_usuario = await this.obtenerIdUsuario();
    const coleccionRef = doc(db, 'usuarios', id_usuario, 'colecciones', expansion_seleccionada.id);
    await setDoc(coleccionRef, {
      "nombre": expansion_seleccionada.nombre,
    });

    // Verificar que la colección se creó correctamente
    const docSnap = await getDoc(coleccionRef);
    if (docSnap.exists()) {
      console.log('Colección creada correctamente:', docSnap.data());
    } else {
      console.error('No se encontró la colección después de crearla.');
    }
  }

  async eliminarCartaFavorita(id: string): Promise<any[]> {
    const idUsuario = await this.obtenerIdUsuario();
    await deleteDoc(doc(db, 'usuarios', idUsuario, 'colecciones', 'favoritos', 'cartas', id));
    console.log('Carta eliminada:', id);
    return this.cargarFavoritos(); // Retorna la lista actualizada
  }

  async cargarCartasDeColeccion(nombreColeccion: string): Promise<any[]> {
    await this.obtenerIdUsuario();
    const ref = collection(db, 'usuarios', this.idUsuarios, 'colecciones', nombreColeccion, 'cartas');
    const snapshot = await getDocs(ref);
    const cartas = snapshot.docs.map(doc => doc.data());
    console.log('Cartas encontradas de la coleccion ',nombreColeccion,': ', cartas);
    return cartas;
  }

  async evaluarMedallaCartaLegendaria(): Promise<boolean> {
    await this.obtenerIdUsuario();

    const cartasRef = collection(
      db,
      "usuarios",
      this.idUsuarios,
      "colecciones",
      "propias",
      "cartas"
    );

    const snapshot = await getDocs(cartasRef);

    for (const doc of snapshot.docs) {
      const carta = doc.data();
      console.log('Carta obtenida:', carta); // Verifica contenido

      const rareza = carta?.['rareza'];

      if (
        rareza === "Rara Ilustración Especial" ||
        rareza === "Rara Híper"
      ) {
        return true; // ¡Tiene una carta legendaria!
      }
    }

    return false; // No tiene cartas con rareza legendaria
  }

  async tieneCincoColecciones(): Promise<boolean> {
    await this.obtenerIdUsuario();
    const coleccionesRef = collection(db, "usuarios", this.idUsuarios, "colecciones");
    const snapshot = await getDocs(coleccionesRef);
    return snapshot.docs.length >= 5;
  }

async tieneCienCartas(): Promise<boolean> {
  await this.obtenerIdUsuario();
  const cartasRef = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'propias', 'cartas');
  const cartasSnap = await getDocs(cartasRef);
  return cartasSnap.size >= 100;
}

// Devuelve la cantidad de colecciones del usuario
async getCantidadColecciones(): Promise<number> {
  await this.obtenerIdUsuario();
  const coleccionesRef = collection(db, "usuarios", this.idUsuarios, "colecciones");
  const snapshot = await getDocs(coleccionesRef);
  return snapshot.docs.length;
}

// Devuelve la cantidad de cartas propias del usuario
async getCantidadCartas(): Promise<number> {
  await this.obtenerIdUsuario();
  const cartasRef = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'propias', 'cartas');
  const cartasSnap = await getDocs(cartasRef);
  return cartasSnap.size;
}

// Devuelve la cantidad de cartas legendarias (Rara Ilustración Especial o Rara Híper)
async cantidadCartasLegendarias(): Promise<number> {
  await this.obtenerIdUsuario();
  const cartasRef = collection(db, 'usuarios', this.idUsuarios, 'colecciones', 'propias', 'cartas');
  const snapshot = await getDocs(cartasRef);
  let cantidad = 0;
  for (const docu of snapshot.docs) {
    const carta = docu.data();
    const rareza = carta?.['rareza'];
    if (
      rareza === "Rara Ilustración Especial" ||
      rareza === "Rara Híper"
    ) {
      cantidad++;
    }
  }
  return cantidad;
}

}
