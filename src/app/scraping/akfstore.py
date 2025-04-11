from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Configurar el navegador
options = webdriver.ChromeOptions()
# options.add_argument('--headless')  # Para ejecutar en modo sin interfaz gráfica
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Número total de páginas
total_paginas = 27

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
                todos_los_productos.append({
                    "nombre": alt,
                    "precio": precio,
                    "disponibilidad": disponible,
                    "imagen": src
                })

            except Exception as e:
                print(f"Error al procesar un producto en la página {pagina}: {str(e)}")
                continue

    # Imprimir todos los productos con imagen
    print("\nTodos los productos con imagen:")
    for producto in todos_los_productos:
        print(f"Producto: {producto['nombre']}")
        print(f"Precio: {producto['precio']}")
        print(f"Disponibilidad: {producto['disponibilidad']}")
        print(f"Imagen: {producto['imagen']}")
        print("-" * 50)

except Exception as e:
    print(f"Error general: {str(e)}")
finally:
    driver.quit()