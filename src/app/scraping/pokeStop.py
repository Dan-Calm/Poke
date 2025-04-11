from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Configurar el navegador
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Para ejecutar en modo sin interfaz gráfica
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

productos  = driver.get("https://pokestop.cl/singles")

time.sleep(2)  # Esperar a que cargue la página

# Buscar elementos con la clase "grid__item"
productos = driver.find_elements(By.CLASS_NAME, "js-item-product")

print(f"Se encontraron {len(productos)} productos en la página.")
print("Productos encontrados:")
for producto in productos:
    print(producto.text)