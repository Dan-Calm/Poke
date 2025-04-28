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
import requests

# Configurar Firebase
credencial = credentials.Certificate("../config/serviceAccountKey.json")  # Ruta a tu archivo JSON de credenciales
firebase_admin.initialize_app(credencial)
db = firestore.client()

# Configurar el navegador
options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")
# options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
# options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
# driver = webdriver.Chrome(options=options)

url_base = "https://www.wikidex.net/wiki/"
path = "Escarlata_y_Púrpura_(TCG):_151"

print("URL completa:")
print( url_base + path)
# URL de la página a scrapear
url = "https://www.wikidex.net/wiki/Zapdos_ex_(151_TCG)"
url = "https://www.wikidex.net/wiki/Blastoise_ex_(151_TCG)"
url_pokemon = "https://www.wikidex.net/wiki/Cambio_(TCG)"




time.sleep(2)  # Esperar a que la página cargue completamente

page = requests.get(url_pokemon)
soup = BeautifulSoup(page.content, "html.parser") #.prettify()

# print("soup:", soup)

galeria = soup.find(class_="gallery mw-gallery-nolines")
print("galeria:", len(galeria))
# print("galeria:", galeria)

imagenes = galeria.find_all(class_="gallerybox")
print("imagenes:", len(imagenes))
for imagen in imagenes:
    print("imagenes:", imagen)
    print("_" * 20)

# imagenes2x = galeria.find_all("img", srcset=True)
# # print("imagenes:", imagenes2x)

# for i, img in enumerate(imagenes2x, start=1):
#     print("/" * 20)
#     srcset = img.get("srcset")
#     # src = img.get("src")
#     print("srcset:", srcset)
#     # print("src:", src)
#     # Dividir el contenido de srcset por comas
#     partes = srcset.split(",")
#     for n, parte in enumerate(partes, start=1):
#         if n == 2:      
#         # Limpiar espacios y extraer la url_pokemon
#             url_pokemon = parte.strip().split(" ")[0]
#             print(f" Imagen:{i} - {url_pokemon}")
#             seleccionadas.append(url)
#     print("/" * 20)



# # Seleccionar los elementos con el selector CSS
# imagenes = driver.find_elements(By.CSS_SELECTOR, "div > a > img[srcset]")
# print("Imagenes:", len(imagenes))
# print("Imagenes:", imagenes)

# # Procesar las imágenes y separar las URLs
# for i, img in enumerate(imagenes, start=1):
#     srcset = img.get_attribute("srcset")  # Obtener el atributo srcset
#     src = img.get_attribute("src")  # Obtener el atributo src
#     print(f"Imagen {i}:")
#     print(f"  srcset: {srcset}")
#     print(f"  src: {src}")
    # Dividir el contenido de srcset por comas
    # partes = srcset.split(",")
    # print(f"Imagen {i}:")
    # for n, parte in enumerate(partes, start=1):
    #     if n == 2:      
    #         # Limpiar espacios y extraer la URL
    #         url = parte.strip().split(" ")[0]
    #         print(f"  - {url}")
    #         seleccionadas.append(url)
    # print("-" * 20)

