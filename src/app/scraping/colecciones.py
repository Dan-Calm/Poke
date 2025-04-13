from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import firebase_admin
from firebase_admin import credentials, firestore
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
url = "https://www.wikidex.net/wiki/Escarlata_y_Púrpura_(TCG):_Evoluciones_en_Paldea"

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

# Recorrer las filas y extraer los datos
for fila in filas:
    columnas = fila.find_elements(By.TAG_NAME, "td")
    if len(columnas) >= 2:  # Asegurarse de que haya suficientes columnas
        codigo = columnas[0].text.strip()  # Extraer el código (ejemplo: 1/102)
        nombre_elemento = columnas[1].find_element(By.TAG_NAME, "a")  # Buscar el enlace dentro del nombre
        nombre = nombre_elemento.text.strip()  # Extraer el nombre (ejemplo: Alakazam)
        url_nombre = nombre_elemento.get_attribute("href")  # Obtener la URL del enlace

        # Generar un ID único a partir de la URL del nombre
        id_documento = re.sub(r"[^\w\s-]", "_", url_nombre.split("/")[-1])  # Limpiar caracteres no válidos

        # Verificar si el nombre contiene dos resultados (español e inglés)
        nombres = nombre.split("\n")  # Dividir por salto de línea si hay dos nombres
        if len(nombres) == 2:
            nombre_espanol = nombres[0]
            nombre_ingles = nombres[1]
        else:
            nombre_espanol = nombre
            nombre_ingles = ""  # Dejar en blanco si no hay nombre en inglés

        # Guardar los datos en Firebase
        carta_ref = coleccion_ref.collection("cartas").document(id_documento)
        carta_ref.set({
            "codigo": codigo,
            "nombre_espanol": nombre_espanol,
            "nombre_ingles": nombre_ingles
        })

        # Imprimir los resultados
        print(f"Código: {codigo}, ID Documento: {id_documento}, Nombre en Español: {nombre_espanol}, Nombre en Inglés: {nombre_ingles}")

# Cerrar el navegador
driver.quit()