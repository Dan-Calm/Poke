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
options.add_argument("--headless=new")
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(options=options)

# Número total de páginas
total_paginas = 1

# Lista para almacenar todos los productos con imagen
todos_los_productos = []

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
            carta_ref = db.collection("productos_afkstore").document(id_documento)
            carta_ref.set({
                "nombre": producto["nombre"],
                "link": producto["link"],
                "codigo_carta": producto["codigo_carta"],
                "tipo_carta": producto["tipo_carta"],
                "imagen": producto["imagen"],
                "tienda": producto["tienda"]
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
    
    todas_las_cartas = cargar_todas_las_colecciones()  # Obtener todas las cartas de todas las colecciones
    print(f"Total de cartas cargadas: {len(todas_las_cartas)}")
    # Imprimir toda la información de todas_las_cartas
    print("\nInformación de todas las cartas cargadas:")
    # for idx, carta in enumerate(todas_las_cartas, start=1):
    #     print(f"Carta {idx}:")
    #     for key, value in carta.items():
    #         print(f"  {key}: {value}")
    #     print("-" * 40)
    # Buscar la carta con el código "061/193"
    carta_especifica = next((carta for carta in todas_las_cartas if carta["codigo"] == "061/193"), None)

    # Verificar si se encontró la carta
    if carta_especifica:
        print("\nCarta encontrada con código '061/193':")
        for key, value in carta_especifica.items():
            print(f"  {key}: {value}")
    else:
        print("\nNo se encontró una carta con el código '061/193'.")

    for pagina in range(1, total_paginas + 1):
        # Actualizar la URL con el número de página
        url = f"https://www.afkstore.cl/collections/singles-pokemon?page={pagina}"
        # url = f"https://www.afkstore.cl/search?q=charizard&options%5Bprefix%5D=last"
        print(f"Scraping página {pagina}: {url}")
        driver.get(url)

        # Buscar elementos con la clase "grid__item"
        productos = driver.find_elements(By.CLASS_NAME, "grid__item")
        print(f"Se encontraron {len(productos)} productos en la página {pagina}.")

        for producto in productos:
            try:
                # Verificar si existe la imagen dentro del producto
                img_elementos = producto.find_elements(By.CSS_SELECTOR, ".card__media img")
                if not img_elementos:
                    print("No se encontró imagen para este producto. Se omite.")
                    continue  # Saltar este producto si no tiene imagen

                # Extraer imagen
                img = img_elementos[0]
                alt = img.get_attribute('alt')
                src = img.get_attribute('src')

                # Extraer enlace del producto
                link_elementos = producto.find_elements(By.CSS_SELECTOR, "a")
                link = link_elementos[0].get_attribute('href') if link_elementos else "Enlace no disponible"

                # Extraer precios
                precio_habitual_elementos = producto.find_elements(By.CSS_SELECTOR, ".price__regular .price-item--regular")
                precio_oferta_elementos = producto.find_elements(By.CSS_SELECTOR, ".price__sale .price-item--sale")

                # Guardar precios en variables individuales
                precio_habitual = precio_habitual_elementos[0].text.strip()
                precio_oferta = precio_oferta_elementos[0].text.strip()
                precio = precio_habitual
                if precio_oferta != "": 
                    precio = precio_oferta
                
                # Limpiar el precio si contiene "A partir de"
                if "A partir de" in precio:
                    precio = precio.replace("A partir de", "").strip()
                
                # Convertir el precio a un número eliminando caracteres no numéricos
                precio = int(re.sub(r"[^\d]", "", precio))
                    
                # Extraer el código de la carta usando una expresión regular
                codigo_carta = "Sin código"
                match = re.search(r"(\d{1,3}/\d{3}|[A-Z]+\d+/[A-Z]*\d+|[A-Z]+\d+)", alt)  # Ajustado para casos especiales
                if match:
                    codigo_carta = match.group(0)
                
                # Buscar si el código ya existe en todas_las_cartas
                carta_existente = next((carta for carta in todas_las_cartas if carta["codigo"] == codigo_carta), None)

                # Preparar el campo Colección
                coleccion = carta_existente["id"] if carta_existente else ""

                # Extraer el tipo de la carta usando una expresión regular
                tipo_carta = "Sin tipo"
                match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX)\b", alt, re.IGNORECASE)  # Busca los tipos en el nombre
                if match_tipo:
                    tipo_carta = match_tipo.group(0).upper()  # Convertir a mayúsculas para uniformidad

                # Agregar el producto con imagen, precios, enlace y detalles a la lista
                producto_data = {
                    "nombre": alt,
                    "link": link,
                    "codigo_carta": codigo_carta,
                    "tipo_carta": tipo_carta,
                    "precio": precio,
                    "imagen": src,
                    "tienda": "AfkStore",
                    "coleccion": coleccion,  # Agregar el campo Colección
                }
                todos_los_productos.append(producto_data)

            except Exception as e:
                print(f"Error al procesar un producto en la página {pagina}: {str(e)}")
                continue

    print("\nScraping completado. Total de productos encontrados:", len(todos_los_productos))
    # Imprimir los datos de todos los productos ordenadamente
    for idx, producto in enumerate(todos_los_productos, start=1):
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
    # guardar_en_firebase(todos_los_productos)

except Exception as e:
    print(f"Error general: {str(e)}")
finally:
    driver.quit()