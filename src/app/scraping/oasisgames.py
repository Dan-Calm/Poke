from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore

# Cargar todas las colecciones y sus cartas usando la función cargar_todas_las_colecciones
from cargarColecciones import cargar_todas_las_colecciones  # Importar la función desde cargarColecciones.py

# Verificar si Firebase ya está inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate("../config/serviceAccountKey.json")  # Cambia esto por la ruta a tu archivo JSON de credenciales
    firebase_admin.initialize_app(cred)

# Inicializar Firestore
db = firestore.client()

# Configurar el navegador
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Ejecutar en modo headless
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# URL de la página a scrapear
url = "https://www.oasisgames.cl/collections/pokemon-singles-instock"
url = "https://www.oasisgames.cl/search?type=product&options%5Bprefix%5D=last&q=charizard"

def guardar_en_firebase(productos):
    """
    Función para guardar los datos en Firebase Firestore.
    """
    try:
        for producto in productos:
            print(f"Guardando producto: {producto['nombre']}")

            # Generar un ID válido para el documento utilizando el enlace del producto
            id_documento = re.sub(r"[^\w\s-]", "", producto["link"]).replace(" ", "_")  # Limpia caracteres no válidos

            # Crear o actualizar el documento de la carta
            carta_ref = db.collection("productos_oasisgames").document(id_documento)
            carta_ref.set({
                "nombre": producto["nombre"],
                "link": producto["link"],
                "codigo_carta": producto["codigo_carta"],
                "tipo_carta": producto["tipo_carta"],
                "imagen": producto["imagen"],
                "tienda": "OasisGames",
                "coleccion": producto["coleccion"],
            }, merge=True)  # Merge asegura que no se sobrescriban datos existentes

            # Obtener la subcolección "precios"
            precios_ref = carta_ref.collection("precios")

            # Obtener el precio más reciente (documento con la fecha final más actual)
            precios_docs = precios_ref.order_by("fecha_final", direction="DESCENDING").limit(1).stream()
            precio_mas_reciente = None
            for doc in precios_docs:
                precio_mas_reciente = doc

            # Fecha actual
            fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if precio_mas_reciente:
                # Si ya existe un precio más reciente, comparar con el precio actual
                datos_precio = precio_mas_reciente.to_dict()
                if datos_precio["precio"] == producto["precio"]:
                    # Si el precio es igual, actualizar la fecha final
                    precios_ref.document(precio_mas_reciente.id).update({
                        "fecha_final": fecha_actual
                    })
                else:
                    # Si el precio es diferente, agregar un nuevo documento
                    precios_ref.add({
                        "precio": producto["precio"],
                        "fecha_inicial": fecha_actual,
                        "fecha_final": fecha_actual
                    })
            else:
                # Si no hay precios registrados, agregar el primer precio
                precios_ref.add({
                    "precio": producto["precio"],
                    "fecha_inicial": fecha_actual,
                    "fecha_final": fecha_actual
                })

        print("Los productos y sus precios se han guardado correctamente en Firebase.")
    except Exception as e:
        print(f"Error al guardar los productos en Firebase: {str(e)}")

try:
    # Cargar todas las cartas existentes en Firebase
    todas_las_cartas = cargar_todas_las_colecciones()  # Obtener todas las cartas de todas las colecciones
    print(f"Total de cartas cargadas: {len(todas_las_cartas)}")
    
    # Abrir la página
    driver.get(url)

    # Buscar todos los productos en la página
    productos = driver.find_elements(By.CLASS_NAME, "grid-view-item")

    # Lista para almacenar los datos de las cartas
    cartas = []

    for producto in productos:
        try:
            # Extraer el nombre de la carta
            nombre_elemento = producto.find_element(By.CLASS_NAME, "grid-view-item__title")
            nombre = nombre_elemento.text.strip()

            # Extraer el enlace de la carta
            link_elemento = producto.find_element(By.TAG_NAME, "a")
            link = link_elemento.get_attribute("href")

            # Extraer el precio de la carta
            precio_elemento = producto.find_element(By.CLASS_NAME, "product-price__price")
            precio = precio_elemento.text.strip()
            precio = int(re.sub(r"[^\d]", "", precio))  # Convertir el precio a un número

            # Extraer la URL de la imagen de la carta
            imagen_elemento = producto.find_element(By.TAG_NAME, "img")
            imagen = imagen_elemento.get_attribute("src")
            
            # Extraer el tipo de la carta usando una expresión regular
            tipo_carta = "Sin tipo"
            match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX|G LV.X)\b", nombre, re.IGNORECASE)  # Busca los tipos en el nombre
            if match_tipo:
                tipo_carta = match_tipo.group(0).upper()  # Convertir a mayúsculas para uniformidad

            # Extraer el código de la carta (entre paréntesis)
            codigo_carta = "Sin código"
            match_codigo = re.search(r"\((.*?)\)", nombre)  # Busca el texto entre paréntesis
            if match_codigo:
                codigo_carta = match_codigo.group(1)

            # Buscar si el código ya existe en todas_las_cartas
            carta_existente = next((carta for carta in todas_las_cartas if carta["codigo"] == codigo_carta), None)

            # Preparar el campo Colección
            coleccion = carta_existente["id"] if carta_existente else ""  # Guardar el ID de la carta en el campo coleccion

            # Guardar los datos en un diccionario
            carta = {
                "nombre": nombre,
                "codigo_carta": codigo_carta,
                "tipo_carta": tipo_carta,
                "coleccion": coleccion,
                "link": link,
                "precio": precio,
                "imagen": imagen,
            }
            cartas.append(carta)

        except Exception as e:
            print(f"Error al procesar un producto: {str(e)}")
            continue
    
    print("\nScraping completado. Total de productos encontrados:", len(cartas))
    # Imprimir los datos de todos los productos ordenadamente
    for idx, producto in enumerate(cartas, start=1):
        print(f"Producto {idx}:")
        print(f"  Nombre: {producto['nombre']}")
        print(f"  Enlace: {producto['link']}")
        print(f"  Código: {producto['codigo_carta']}")
        print(f"  Colección: {producto['coleccion']}")
        print(f"  Tipo: {producto['tipo_carta']}")
        print(f"  Precio: {producto['precio']}")
        print(f"  Imagen: {producto['imagen']}")
        print("-" * 40)
    # Guardar los productos en Firebase
    guardar_en_firebase(cartas)

except Exception as e:
    print(f"Error general: {str(e)}")

finally:
    # Cerrar el navegador
    driver.quit()