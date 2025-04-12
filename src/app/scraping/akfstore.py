from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase con las credenciales del archivo JSON
cred = credentials.Certificate("../config/serviceAccountKey.json")
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
            db.collection("productos_afkstore").add(producto)
        print("Los productos se han guardado correctamente en Firebase.")
    except Exception as e:
        print(f"Error al guardar los productos en Firebase: {str(e)}")
        
try:
    for pagina in range(1, total_paginas + 1):
        # Actualizar la URL con el número de página
        url = f"https://www.afkstore.cl/collections/singles-pokemon?page={pagina}"
        print(f"Scraping página {pagina}: {url}")
        driver.get(url)


        print("prueba")
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

                # Extraer precio
                precio_elementos = producto.find_elements(By.CSS_SELECTOR, ".price-item")
                if precio_elementos:
                    # Si hay múltiples precios (por ejemplo, precio regular y precio en oferta), toma el primero
                    precio = precio_elementos[0].text.strip()
                else:
                    # Si no se encuentra el precio, asignar un valor predeterminado
                    precio = "Precio no disponible"

                # Verificar disponibilidad
                disponible = "Disponible" if "Agotado" not in producto.text else "Agotado"

                # Agregar el producto con imagen a la lista
                producto_data = {
                    "nombre": alt,
                    "precio": precio,
                    "disponibilidad": disponible,
                    "imagen": src
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
        print(f"  Precio: {producto['precio']}")
        print(f"  Disponibilidad: {producto['disponibilidad']}")
        print(f"  Imagen: {producto['imagen']}")
        print("-" * 40)

except Exception as e:
    print(f"Error general: {str(e)}")
finally:
    driver.quit()