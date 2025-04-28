from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import firebase_admin
from firebase_admin import credentials, firestore
from selenium.common.exceptions import NoSuchElementException

import re
import time

from bs4 import BeautifulSoup

# Configurar Firebase
credencial = credentials.Certificate("../config/serviceAccountKey.json")  # Ruta a tu archivo JSON de credenciales
firebase_admin.initialize_app(credencial)
db = firestore.client()

# Configurar el navegador
options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# URL de la página a scrapear
url = "https://www.wikidex.net/wiki/Escarlata_y_Púrpura_(TCG):_151"
# url = "https://www.wikidex.net/wiki/Base_Set_(TCG)"
driver.get(url)

# Crear una lista para almacenar los datos de las cartas
cartas = []

# Nombre de la colección (extraído de la URL)
nombre_coleccion = url.split("/")[-1]  # Obtiene "Base_Set_(TCG)"

# Abrir la página
driver.get(url)

# Buscar la tabla que contiene las cartas
tabla_cartas = driver.find_element(By.XPATH, "//table[contains(@class, 'sortable')]")

# Extraer las filas de la tabla
filas = tabla_cartas.find_elements(By.TAG_NAME, "tr")[1:]  # Omitir la primera fila (encabezados)
print("Filas:", len(filas))

seleccionadas = []
def buscarImagenes(url, cantidad):
    # Abrir la página
    driver.get(url)
    time.sleep(2)  # Esperar a que la página cargue completamente

    # Seleccionar los elementos con el selector CSS
    imagenes = driver.find_elements(By.CSS_SELECTOR, "div > a > img[srcset]")

    # Procesar las imágenes y separar las URLs
    for i, img in enumerate(imagenes, start=1):
        srcset = img.get_attribute("srcset")
        if i >= cantidad:
            # Dividir el contenido de srcset por comas
            partes = srcset.split(",")
            # print(f"Imagen {i}:")
            for n, parte in enumerate(partes, start=1):
                if n == 2:      
                    # Limpiar espacios y extraer la URL
                    url = parte.strip().split(" ")[0]
                    # print(f"  - {url}")
                    seleccionadas.append(url)

    return seleccionadas

for fila in filas:
    columnas = fila.find_elements(By.TAG_NAME, "td")
    
    codigo = columnas[0].text.strip()  # Extraer el código (ejemplo: 1/102)
    nombre_elemento = columnas[1].find_element(By.TAG_NAME, "a")  # Buscar el enlace dentro del nombre
    nombre = nombre_elemento.text.strip()  # Extraer el nombre (ejemplo: Venusaur-EX)
    url_nombre = nombre_elemento.get_attribute("href")  # Obtener la URL del enlace
    
    # Generar un ID único a partir del código y la URL del nombre
    id_documento = f"{codigo}_{re.sub(r'[^\w\s-]', '_', url_nombre.split('/')[-1])}".strip("_")

    # Reemplazar caracteres codificados en UTF-8 con un guion bajo
    id_documento = re.sub(r'%[0-9A-Fa-f]{2}', '_', id_documento)
        
    # print("Nombre:", nombre)
    # print("Codigo:", codigo)
    # print("URL:", url_nombre)
    # print("ID Documento:", id_documento)
    # print("---"*10)
    
    # Almacenar los datos en la lista
    cartas.append({
        "codigo": codigo,
        "id_documento": id_documento,
        "nombre_espanol": nombre,
        "url_nombre": url_nombre
    })
    
# Agrupar las cartas por nombre_espanol
cartas_agrupadas = {}
for carta in cartas:
    url = carta["url_nombre"]
    if url not in cartas_agrupadas:
        cartas_agrupadas[url] = []
    cartas_agrupadas[url].append(carta)
    
for cartas in cartas_agrupadas.values():
    imgs = []
    imgs = buscarImagenes(cartas[0]["url_nombre"], len(cartas))
    for img in imgs:
        print(img)
        print("-"*20)
    print("Largo: ", len(cartas))
    print("URL:", cartas[0]["url_nombre"])
    # buscarImagenes(cartas[0]["url_nombre"])
    print("*" * 40)
    # print(cartas)
    for carta in cartas:
        print("Nombre:", carta["nombre_espanol"])
        print("ID Documento:", carta["id_documento"])
        print("URL Nombre:", carta["url_nombre"])
        print("-" * 40)
    print("=" * 40)



    # # Imprimir las cartas agrupadas de forma ordenada
    # for url, grupo in cartas_agrupadas.items():
    #     if len(grupo) > 1:
    #         print(f"Nombre: {url}")
    #         # Navegar a la URL de la carta
    #         driver.get(url)
    #         time.sleep(2)
    #         for index, carta in enumerate(grupo, start=1):  # Usar enumerate para obtener el índice
    #             print(f"  Carta {index}:")
    #             print(f"  Código: {carta['codigo']}")
    #             print(f"  ID Documento: {carta['id_documento']}")
    #             print(f"  Nombre Español: {carta['nombre_espanol']}")
    #             print(f"  URL Nombre: {carta['url_nombre']}")
    #             print("-" * 40)
    #         print("=" * 40)
    