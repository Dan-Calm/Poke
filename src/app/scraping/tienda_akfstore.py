from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


import firebase_admin
from firebase_admin import credentials, firestore

# Cargar todas las colecciones y sus cartas usando la función cargar_todas_las_colecciones
from cargar_expansiones import cargar_todas_las_colecciones

# Verificar si Firebase ya está inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate("../config/serviceAccountKey.json")  # Cambia esto por la ruta a tu archivo JSON de credenciales
    firebase_admin.initialize_app(cred)

# Inicializar Firestore
db = firestore.client()


# Configurar el navegador
options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")
# options.add_argument('--disable-gpu')
# options.add_argument('--no-sandbox')
# options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(options=options)

# Número total de páginas
total_paginas = 1

# Lista para almacenar todos los productos con imagen
todos_los_productos = []

def guardar_en_firebase(productos):
    """
    Función para guardar los datos en Firebase Firestore en la nueva estructura.
    """
    try:
        # Crear una referencia a la colección "tiendas" y al documento "productos_afkstore"
        tienda_ref = db.collection("tiendas").document("productos_afkstore")
        tienda_ref.set({
            "nombre": "AfkStore",
        })
        
        for producto in productos:
            print(f"Guardando producto: {producto['nombre']}")
            
            # Generar un ID válido para el documento utilizando el enlace del producto y el idioma
            # Construir el id_documento: "afk_store" + nombre_limpio + codigo_carta (999/999 -> 999_999) + idioma
            codigo_carta_id = producto["codigo_carta"].replace("/", "_")
            nombre_id = re.sub(r"[^\w\s-]", "", producto["nombre_limpio"]).replace(" ", "_")
            id_documento = f"afk_store_{nombre_id}_{codigo_carta_id}"
            id_documento = f"{id_documento}_{producto['idioma']}"

            # Crear o actualizar el documento del producto dentro de la subcolección "productos"
            producto_ref = tienda_ref.collection("productos").document(id_documento)
            producto_ref.set({
                "nombre": producto["nombre"],
                "nombre_limpio": producto["nombre_limpio"],
                "link": producto["link"],
                "codigo_carta": producto["codigo_carta"],
                "tipo_carta": producto["tipo_carta"],
                "precio": producto["precio"],
                "imagen": producto["imagen"],
                "tienda": producto["tienda"],
                "id_tienda": "productos_afkstore",
                "coleccion": producto["coleccion"],
                "idioma": producto["idioma"],
                "stock": producto["stock"]
            }, merge=True)  # Merge asegura que no se sobrescriban datos existentes

            # Obtener la subcolección "precios"
            precios_ref = producto_ref.collection("precios")

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
                
            stocks_ref = producto_ref.collection("stocks")

            # Obtener el stock más reciente (documento con la fecha final más actual)
            stocks_docs = stocks_ref.order_by("fecha_final", direction="DESCENDING").limit(1).stream()
            stock_mas_reciente = None
            for doc in stocks_docs:
                stock_mas_reciente = doc

            if stock_mas_reciente:
                datos_stock = stock_mas_reciente.to_dict()
                if datos_stock["stock"] == producto["stock"]:
                    # Si el stock es igual, actualizar la fecha final
                    stocks_ref.document(stock_mas_reciente.id).update({
                        "fecha_final": fecha_actual
                    })
                else:
                    # Si el stock es diferente, agregar un nuevo documento
                    stocks_ref.add({
                        "stock": producto["stock"],
                        "fecha_inicial": fecha_actual,
                        "fecha_final": fecha_actual
                    })
            else:
                # Si no hay stocks registrados, agregar el primer stock
                stocks_ref.add({
                    "stock": producto["stock"],
                    "fecha_inicial": fecha_actual,
                    "fecha_final": fecha_actual
                })

        print("Los productos y sus precios se han guardado correctamente en Firebase.")
    except Exception as e:
        print(f"Error al guardar los productos en Firebase: {str(e)}")
try: 
    
    todas_las_cartas = cargar_todas_las_colecciones()  # Obtener todas las cartas de todas las colecciones
    print(f"Total de cartas cargadas: {len(todas_las_cartas)}")
            
    for pagina in range(1, total_paginas + 1):
        # Actualizar la URL con el número de página
        url = f"https://www.afkstore.cl/collections/singles-pokemon?page={pagina}"
        # url = f"https://www.afkstore.cl/search?q=charizard&options%5Bprefix%5D=last"
        url = f"https://www.afkstore.cl/search?q=pikachu&options%5Bprefix%5D=last"
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
                link = link_elementos[0].get_attribute('href')
                
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

                # Imprimir todas las cartas de todas_las_cartas que tengan el mismo código que codigo_carta
                candidatos_match = [carta for carta in todas_las_cartas if carta["codigo"] == codigo_carta]
                print("--" * 40)
                print(f"Producto encontrado: {alt}")
                print(f"Candidatos a match para el código {codigo_carta}:")
                for candidato in candidatos_match:
                    print(candidato)

                # Comparar palabras en común entre el alt y el nombre_espanol de los candidatos
                def palabras_en_comun(texto1, texto2):
                    palabras1 = set(texto1.lower().split())
                    palabras2 = set(texto2.lower().split())
                    return len(palabras1 & palabras2)  # Retorna el número de palabras en común

                # Determinar el mejor match basado en palabras en común
                mejor_match = None
                max_palabras_comunes = 0

                for candidato in candidatos_match:
                    palabras_comunes = palabras_en_comun(alt, candidato["nombre_espanol"])
                    print(f"Comparando con: {candidato['nombre_espanol']}, Palabras en común: {palabras_comunes}")
                    if palabras_comunes > max_palabras_comunes:
                        max_palabras_comunes = palabras_comunes
                        mejor_match = candidato

                if mejor_match:
                    print(f"Mejor match encontrado: {mejor_match["id"]}")
                else:
                    print("No se encontró un match claro.")

                # Preparar el campo Colección
                coleccion = carta_existente["id"] if carta_existente else ""  # Guardar el ID de la carta en el campo coleccion

                # Extraer el tipo de la carta usando una expresión regular
                tipo_carta = "Sin tipo"
                match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX|G LV.X)\b", alt, re.IGNORECASE)  # Busca los tipos en el nombre
                if match_tipo:
                    tipo_carta = match_tipo.group(0).upper()  # Convertir a mayúsculas para uniformidad

                # Limpiar el nombre del producto eliminando el código y el tipo
                nombre_limpio = re.sub(rf"(\b{codigo_carta}\b|\b{tipo_carta}\b)", "", alt, flags=re.IGNORECASE).strip()

                # Eliminar guiones sobrantes y espacios redundantes
                nombre_limpio = re.sub(r"\s*-\s*", " ", nombre_limpio).strip()  # Reemplazar guiones con un espacio
                nombre_limpio = re.sub(r"\s{2,}", " ", nombre_limpio).strip()  # Reemplazar múltiples espacios por uno solo

                # Agregar el producto con imagen, precios, enlace y detalles a la lista
                producto_data = {
                    "nombre": alt,
                    "nombre_limpio": nombre_limpio,  
                    "link": link,
                    "codigo_carta": codigo_carta,
                    "tipo_carta": tipo_carta,
                    "precio": precio,
                    "imagen": src,
                    "tienda": "AfkStore",
                    "coleccion": mejor_match["id"],  
                }
                todos_los_productos.append(producto_data)

            except Exception as e:
                print(f"Error al procesar un producto en la página {pagina}: {str(e)}")
                continue

    print("\nScraping completado. Total de productos encontrados:", len(todos_los_productos))
    # Imprimir los datos de todos los productos ordenadamente
    todos_los_productos_idioma = []

    for idx, producto in enumerate(todos_los_productos, start=1):
        print(f"Producto {idx}:")
        print(f"  Nombre: {producto['nombre']}")
        print(f"  Nombre limpio: {producto['nombre_limpio']}")
        print(f"  Enlace: {producto['link']}")
        driver.get(producto['link'])
        time.sleep(2)

        radios = driver.find_elements(By.CSS_SELECTOR, 'input[type="radio"][name="Idioma"]')
        print(f"  Se encontraron {len(radios)} botones de idioma.")

        for radio in radios:
            try:
                driver.execute_script("arguments[0].click();", radio)
                time.sleep(1)  # Espera a que el DOM se actualice

                idioma_valor = radio.get_attribute('value')

                # Extraer el precio
                try:
                    precio_elem = driver.find_element(By.CSS_SELECTOR, ".price-item.price-item--regular")
                    precio = precio_elem.text.strip()
                    # Limpiar el precio para dejarlo como número entero
                    precio = int(re.sub(r"[^\d]", "", precio))
                except Exception:
                    precio = 0

                # Extraer el stock
                try:
                    stock_elem = driver.find_element(By.CSS_SELECTOR, ".product__inventory.no-js-hidden")
                    stock_text = stock_elem.text.strip()
                    if "Agotado" in stock_text:
                        stock = 0
                    else:
                        import re
                        match = re.search(r'(\d+)', stock_text)
                        stock = int(match.group(1)) if match else 0
                except Exception:
                    stock = 0

                print(f"    Idioma: {idioma_valor}")
                print(f"      Precio: {precio}")
                print(f"      Stock: {stock}")

                # Crear un producto por idioma
                producto_data_idioma = {
                    "nombre": producto["nombre"],
                    "nombre_limpio": producto["nombre_limpio"],
                    "link": producto["link"],
                    "codigo_carta": producto["codigo_carta"],
                    "tipo_carta": producto["tipo_carta"],
                    "precio": precio,
                    "stock": stock,
                    "imagen": producto["imagen"],
                    "tienda": producto["tienda"],
                    "coleccion": producto["coleccion"],
                    "idioma": idioma_valor
                }
                todos_los_productos_idioma.append(producto_data_idioma)

            except Exception as e:
                print(f"    Error al hacer click en el radio: {str(e)}")

        print("-" * 40)

    # Ahora todos_los_productos_idioma contiene un producto por cada idioma/variante
    # Puedes guardar estos productos en Firebase o procesarlos como desees

    # Guardar los productos en Firebase
    guardar_en_firebase(todos_los_productos_idioma)

except Exception as e:
    print(f"Error general: {str(e)}")
finally:
    driver.quit()