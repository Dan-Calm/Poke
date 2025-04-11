from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase con las credenciales del archivo JSON
cred = credentials.Certificate("c:\\Users\\DanielAntonioCaldero\\Desktop\\Portafolio\\Poke\\src\\app\\config\\serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Inicializar Firestore
db = firestore.client()

# Configurar el navegador
options = webdriver.ChromeOptions()
# options.add_argument('--headless')  # Para ejecutar en modo sin interfaz gráfica
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Número total de páginas
total_paginas = 2

# Lista para almacenar todos los productos con imagen
todos_los_productos = []

try:
    for pagina in range(1, total_paginas + 1):
        # Actualizar la URL con el número de página
        url = f"https://www.afkstore.cl/collections/singles-pokemon?page={pagina}"
        print(f"Scraping página {pagina}: {url}")
        driver.get(url)
        time.sleep(2)  # Esperar a que cargue la página

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
                precio = precio_elementos[0].text if precio_elementos else "Precio no disponible"

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

                # Guardar el producto en Firestore
                db.collection("productos_afkstore").add(producto_data)

            except Exception as e:
                print(f"Error al procesar un producto en la página {pagina}: {str(e)}")
                continue

    print("\nTodos los productos han sido guardados en Firebase Firestore.")

except Exception as e:
    print(f"Error general: {str(e)}")
finally:
    driver.quit()