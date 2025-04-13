import firebase_admin
from firebase_admin import credentials, firestore

# Configurar Firebase
cred = credentials.Certificate("../config/serviceAccountKey.json")  # Cambia esto por la ruta a tu archivo JSON de credenciales
firebase_admin.initialize_app(cred)
db = firestore.client()

def cargar_cartas_de_coleccion(nombre_coleccion):
    try:
        # Referencia a la colección en Firebase
        coleccion_ref = db.collection("colecciones").document(nombre_coleccion)
        
        # Obtener el campo "nombre" de la colección
        coleccion_data = coleccion_ref.get().to_dict()
        nombre_coleccion_campo = coleccion_data.get("nombre", "Sin nombre")  # Valor por defecto si no existe el campo
        
        # Obtener todas las cartas
        cartas_ref = coleccion_ref.collection("cartas")
        cartas = cartas_ref.stream()
        
        # Crear una lista con la información de las cartas
        lista_cartas = []
        for carta in cartas:
            carta_data = carta.to_dict()
            carta_data["id"] = carta.id  # Agregar el ID del documento
            carta_data["Colección"] = nombre_coleccion_campo  # Agregar el campo "Colección"
            lista_cartas.append(carta_data)
        
        return lista_cartas
    except Exception as e:
        print(f"Error al cargar las cartas de la colección '{nombre_coleccion}': {e}")
        return []

def cargar_todas_las_colecciones():
    try:
        # Obtener todas las colecciones
        colecciones_ref = db.collection("colecciones")
        colecciones = colecciones_ref.stream()
        
        todas_las_cartas = []
        for coleccion in colecciones:
            nombre_coleccion = coleccion.id  # Usar el ID del documento como nombre de la colección
            print(f"Cargando cartas de la colección: {nombre_coleccion}")
            cartas = cargar_cartas_de_coleccion(nombre_coleccion)
            # for carta in cartas:
            #     print(carta)
            todas_las_cartas.extend(cartas)
        
        return todas_las_cartas
    except Exception as e:
        print(f"Error al cargar las colecciones: {e}")
        return []
        
    except Exception as e:
        print(f"Error al cargar las colecciones: {e}")