from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re

# Configurar el navegador
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Para ejecutar en modo sin interfaz gráfica
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(options=options)

inicio = time.time()

total_paginas = 1

# Navegar a la página
for pagina in range(1, total_paginas + 1):
        # Actualizar la URL con el número de página
        url = f"https://pokestop.cl/singles/?mpage={pagina}"
        print(f"Scraping página {pagina}: {url}")
        driver.get(url)

#  Buscar elementos con la clase "js-item-product"
productos = driver.find_elements(By.CLASS_NAME, "js-item-product")

# Lista para almacenar los datos de los productos
lista_productos = []

print(f"Se encontraron {len(productos)} productos en la página.")
print("Productos encontrados:")

for producto in productos:
    try:
        # Extraer nombre del producto
        nombre_elementos = producto.find_elements(By.CSS_SELECTOR, ".js-item-name")
        nombre = nombre_elementos[0].text.strip() if nombre_elementos else "Nombre no disponible"

        # Extraer precio
        precio_elementos = producto.find_elements(By.CSS_SELECTOR, ".js-price-display")
        precio = precio_elementos[0].text.strip() if precio_elementos else "Precio no disponible"
        
        # Convertir el precio a un número eliminando caracteres no numéricos
        precio = int(re.sub(r"[^\d]", "", precio))
        
        # Extraer el código de la carta usando una expresión regular
        codigo_carta = "Sin código"
        match = re.search(r"(\d{1,3}/\d{3}|[A-Z]+\d+/[A-Z]*\d+|[A-Z]+\d+)", nombre)  # Ajustado para casos especiales
        if match:
            codigo_carta = match.group(0)
            
        # Extraer el tipo de la carta usando una expresión regular
        tipo_carta = "Sin tipo"
        match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX)\b", nombre, re.IGNORECASE)  # Busca los tipos en el nombre
        if match_tipo:
            tipo_carta = match_tipo.group(0).upper()  # Convertir a mayúsculas para uniformidad
            

        # Verificar disponibilidad
        disponible = "Disponible" if "Agotado" not in producto.text else "Agotado"

        # Extraer enlace del producto
        link_elementos = producto.find_elements(By.CSS_SELECTOR, "a")
        link = link_elementos[0].get_attribute('href') if link_elementos else "Enlace no disponible"

        # Verificar si existe la imagen dentro del producto
        img_elementos = producto.find_elements(By.CSS_SELECTOR, ".js-item-image")
        if not img_elementos:
            print("No se encontró imagen para este producto. Se omite.")
            continue  # Saltar este producto si no tiene imagen

        # Extraer imagen
        img = img_elementos[0]
        srcset = img.get_attribute('srcset')
        
        # Quitar los "//" al inicio de las URLs
        if srcset:
            srcset = srcset.replace("//", "https://")
            srcset = srcset.split(",")[0].strip().split(" ")[0]  # Tomar la primera URL
    
        # Verificar que los datos esenciales no estén vacíos antes de agregar a la lista
        if nombre and precio and link and img:
            lista_productos.append({
                "nombre": nombre,
                "link": link,
                "codigo_carta": codigo_carta,
                "tipo_carta": tipo_carta,
                "precio": precio,
                "disponibilidad": disponible,
                "img": srcset,
                "tienda": "PokeStop"
            })

            # Imprimir los datos del producto
            print(f"Nombre: {nombre}")
            print(f"Link: {link}")
            print(f"Código: {codigo_carta}")
            print(f"Tipo: {tipo_carta}")
            print(f"Precio: {precio}")
            print(f"Disponibilidad: {disponible}")
            print(f"Imagen: {srcset}")
            print(f"Tienda: PokeStop")
            print("-------------------")
        else:
            print("Producto con información incompleta, no se agrega a la lista.")
    except Exception as e:
        print(f"Error al procesar un producto: {str(e)}")
        continue

fin = time.time()
tiempo_total = fin - inicio
print(f"Tiempo total de ejecución: {tiempo_total} segundos")

# Imprimir la lista completa de productos
print("\nLista completa de productos:")
for producto in lista_productos:
    print(producto)

driver.quit()