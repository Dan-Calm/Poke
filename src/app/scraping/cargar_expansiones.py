import firebase_admin
from firebase_admin import credentials, firestore

# Configurar Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("../config/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()



def cargar_cartas_de_coleccion(nombre_coleccion):
    try:
        # Referencia a la colección en Firebase
        coleccion_ref = db.collection("expansiones").document(nombre_coleccion)
        
        # Obtener el campo "nombre" de la colección
        coleccion_data = coleccion_ref.get().to_dict()
        nombre_coleccion_campo = coleccion_data.get("Nombre", "Sin nombre")  # Valor por defecto si no existe el campo
        
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
        # Obtener todas las expansiones
        colecciones_ref = db.collection("expansiones")
        expansiones = colecciones_ref.stream()
        
        todas_las_cartas = []
        for expansion in expansiones:
            # Obtener los datos del documento de la colección
            coleccion_data = expansion.to_dict()
            # Usar el campo "nombre" de la colección, con un valor por defecto si no existe
            nombre_coleccion = coleccion_data.get("nombre", "Sin nombre")
            print(f"Cargando cartas de la colección: {nombre_coleccion}")
            
            # Cargar las cartas de la colección
            cartas = cargar_cartas_de_coleccion(expansion.id)  # Usar el ID para acceder a las cartas
            for carta in cartas:
                carta["Colección"] = nombre_coleccion  # Agregar el nombre de la colección a cada carta
            todas_las_cartas.extend(cartas)
        
        return todas_las_cartas
    except Exception as e:
        print(f"Error al cargar las expansiones: {e}")
        return []

if __name__ == "__main__":
    todas_las_cartas = cargar_todas_las_colecciones()
    for carta in todas_las_cartas:
        print(carta)
