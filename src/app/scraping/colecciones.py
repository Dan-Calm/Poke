from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import firebase_admin
from firebase_admin import credentials, firestore
import time
import re  # Para limpiar el código de caracteres no válidos

# Configurar Firebase
cred = credentials.Certificate("../config/serviceAccountKey.json")  # Cambia esto por la ruta a tu archivo JSON de credenciales
firebase_admin.initialize_app(cred)
db = firestore.client()

# Configurar el navegador
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(options=options)

# URL de la página a scrapear
url = "https://www.wikidex.net/wiki/Base_Set_(TCG)"
# url = "https://www.wikidex.net/wiki/Jungla_(TCG)"
# url = "https://www.wikidex.net/wiki/Fósil_(TCG)"
# url = "https://www.wikidex.net/wiki/Escarlata_y_Púrpura_(TCG):_Chispas_Fulgurantes"


# Nombre de la colección (extraído de la URL)
nombre_coleccion = url.split("/")[-1]  # Obtiene "Base_Set_(TCG)"

# Abrir la página
driver.get(url)

# Buscar la tabla que contiene las cartas
tabla_cartas = driver.find_element(By.XPATH, "//table[contains(@class, 'sortable')]")

# Extraer las filas de la tabla
filas = tabla_cartas.find_elements(By.TAG_NAME, "tr")[1:]  # Omitir la primera fila (encabezados)

# Crear una referencia a la colección en Firebase
coleccion_ref = db.collection("colecciones").document(nombre_coleccion)

# Agregar el campo "nombre" al documento de la colección
coleccion_ref.set({
    "nombre": nombre_coleccion.replace("_", " ").replace(":", ": ")  # Formatear el nombre para que sea legible
})

def guardar_cartas_en_firebase(cartas, coleccion_ref):
    """
    Función para guardar las cartas en Firebase Firestore.
    """
    try:
        for carta in cartas:
            print(f"Guardando carta: {carta['nombre_espanol']} - ({carta['codigo']})")

            # Crear o actualizar el documento de la carta
            carta_ref = coleccion_ref.collection("cartas").document(carta["id_documento"])
            carta_ref.set({
                "codigo": carta["codigo"],
                "nombre_espanol": carta["nombre_espanol"],
                "nombre_ingles": carta["nombre_ingles"],
                "imagen_url": carta["imagen_url"],
                "url_nombre": carta["url_nombre"],
                "coleccion": nombre_coleccion.replace("_", " ").replace(":", ": ")
            }, merge=True)

        print("Las cartas se han guardado correctamente en Firebase.")
    except Exception as e:
        print(f"Error al guardar las cartas en Firebase: {str(e)}")


# Crear una lista para almacenar los datos de las cartas
cartas = []

# Recorrer las filas y extraer los datos de la tabla
for fila in filas:
    columnas = fila.find_elements(By.TAG_NAME, "td")
    if len(columnas) >= 2:  # Asegurarse de que haya suficientes columnas
        codigo = columnas[0].text.strip()  # Extraer el código (ejemplo: 1/102)
        nombre_elemento = columnas[1].find_element(By.TAG_NAME, "a")  # Buscar el enlace dentro del nombre
        nombre = nombre_elemento.text.strip()  # Extraer el nombre (ejemplo: Venusaur-EX)
        url_nombre = nombre_elemento.get_attribute("href")  # Obtener la URL completa del enlace

        # Generar un ID único a partir del código y la URL del nombre
        id_documento = f"{codigo}_{re.sub(r'[^\w\s-]', '_', url_nombre.split('/')[-1])}".strip("_")

        # Reemplazar caracteres codificados en UTF-8 con un guion bajo
        id_documento = re.sub(r'%[0-9A-Fa-f]{2}', '_', id_documento)

        # Validar que el ID no contenga caracteres no válidos
        if '/' in id_documento:
            id_documento = id_documento.replace('/', '_')
    
        # Verificar si el nombre contiene dos resultados (español e inglés)
        nombres = nombre.split("\n")  # Dividir por salto de línea si hay dos nombres
        if len(nombres) == 2:
            nombre_espanol = nombres[0]
            nombre_ingles = nombres[1]
        else:
            nombre_espanol = nombre
            nombre_ingles = ""  # Dejar en blanco si no hay nombre en inglés

        # Almacenar los datos en la lista
        cartas.append({
            "codigo": codigo,
            "id_documento": id_documento,
            "nombre_espanol": nombre_espanol,
            "nombre_ingles": nombre_ingles,
            "url_nombre": url_nombre
        })

# Ahora recorrer la lista de cartas para extraer las imágenes
for carta in cartas:
    driver.get(carta["url_nombre"])  # Navegar a la página de la carta
    imagen_url = "No disponible"  # Valor predeterminado si no se encuentra la imagen

    try:
        # Intentar encontrar la imagen principal en un <div> con clase "imagen"
        imagen_elemento = driver.find_element(By.XPATH, "//div[@class='imagen']/a[@class='image']/img")
        imagen_url = imagen_elemento.get_attribute("src")
    except Exception:
        try:
            # Intentar encontrar la imagen en una galería (<ul class="gallery">)
            imagen_elemento = driver.find_element(By.XPATH, "//ul[@class='gallery']//img")
            imagen_url = imagen_elemento.get_attribute("src")
        except Exception:
            try:
                # Intentar obtener la imagen desde las metaetiquetas <meta property="og:image">
                meta_elemento = driver.find_element(By.XPATH, "//meta[@property='og:image']")
                imagen_url = meta_elemento.get_attribute("content")
            except Exception as e:
                print(f"Error al obtener la imagen para {carta['nombre_espanol']}: {e}")

    # Agregar la URL de la imagen a los datos de la carta
    carta["imagen_url"] = imagen_url
    # Esperar un tiempo para evitar saturar la página con demasiadas consultas
    # time.sleep(1)
    # Imprimir la información de la carta actual
    print(f"Información de la carta actual:")
    print(f"Código: {carta['codigo']}")
    print(f"ID Documento: {carta['id_documento']}")
    print(f"Nombre en Español: {carta['nombre_espanol']}")
    print(f"Nombre en Inglés: {carta['nombre_ingles']}")
    print(f"URL del Nombre: {carta['url_nombre']}")
    print(f"URL de la Imagen: {carta['imagen_url']}")
    print("-" * 40)
    
print("\nScraping completado. Total de productos encontrados:", len(cartas))


# # Imprimir la información de las cartas
# for carta in cartas:
#     print(f"Código: {carta['codigo']}")
#     print(f"ID Documento: {carta['id_documento']}")
#     print(f"Nombre en Español: {carta['nombre_espanol']}")
#     print(f"Nombre en Inglés: {carta['nombre_ingles']}")
#     print(f"URL del Nombre: {carta['url_nombre']}")
#     print(f"URL de la Imagen: {carta['imagen_url']}")
#     print("-" * 40)
# Guardar las cartas en Firebase
# guardar_cartas_en_firebase(cartas, coleccion_ref)

# Cerrar el navegador
driver.quit()