from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

def obtener_urls_colecciones_selenium(url):
    # Configurar el navegador
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # Ejecutar en modo headless (sin interfaz gráfica)
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    # Inicializar el driver de Selenium
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        # Abrir la página
        driver.get(url)

        # Esperar un tiempo para que la página cargue completamente
        time.sleep(2)

        # Buscar todas las filas de la tabla que contienen las colecciones
        filas = driver.find_elements(By.XPATH, "//tr[th[@class='tfx-fw']]")

        # Lista para almacenar las URLs de las colecciones
        urls_colecciones = []

        # Recorrer las filas y extraer los enlaces
        for fila in filas:
            enlace = fila.find_element(By.XPATH, ".//a[@href]")  # Buscar el enlace dentro de la fila
            if enlace:
                href = enlace.get_attribute("href")  # Obtener el atributo href
                urls_colecciones.append(href)

        # Ordenar las URLs alfabéticamente
        urls_colecciones.sort()

        # Imprimir las URLs en la consola
        for url in urls_colecciones:
            print(url)

        return urls_colecciones

    except Exception as e:
        print(f"Error durante el scraping: {e}")
        return []

    finally:
        # Cerrar el navegador
        driver.quit()

# URL de la página a scrapear
url_pagina = "https://www.wikidex.net/wiki/Lista_de_expansiones_del_Juego_de_Cartas_Coleccionables_Pokémon"

# Llamar a la función
obtener_urls_colecciones_selenium(url_pagina)