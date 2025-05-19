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
from datetime import datetime
# import pytz

# Configurar Firebase
credencial = credentials.Certificate("../config/serviceAccountKey.json")  # Ruta a tu archivo JSON de credenciales
firebase_admin.initialize_app(credencial)
db = firestore.client()

# Configurar el navegador
# options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")
# options.add_argument('--disable-gpu')
# options.add_argument('--no-sandbox')
# options.add_argument('--disable-dev-shm-usage')

# Inicializar el driver de Selenium
# driver = webdriver.Chrome(options=options)

url_base = "https://www.wikidex.net"

path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Chispas_Fulgurantes"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Corona_Astral"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Evoluciones_Prismáticas"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Fábula_Sombría"
# path_expansion = "/wiki/Espada_y_Escudo_(TCG):_Oscuridad_Incandescente"
# path_expansion = "/wiki/Espada_y_Escudo_(TCG):_Resplandor_Astral"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Mascarada_Crepuscular"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Fuerzas_Temporales"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Destinos_de_Paldea"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Brecha_Paradójica"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_151"
# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Llamas_Obsidianas"

# path_expansion = "/wiki/Escarlata_y_Púrpura_(TCG):_Juntos_de_Aventuras"
# path_expansion = "/wiki/Base_Set_(TCG)"
# path_expansion = "/wiki/SV_Black_Star_Promos_(TCG)"

# expansion = "Chispas Fulgurantes"

url_expansion =  url_base + path_expansion
print("Expansion:" , url_expansion)

# URL de la página a scrapear
# url = "https://www.wikidex.net/wiki/Zapdos_ex_(151_TCG)"
# url = "https://www.wikidex.net/wiki/Blastoise_ex_(151_TCG)"
# path_pokemon = "Cambio_(TCG)"
# path_pokemon = "Venusaur_ex_(151_TCG)"
# path_pokemon = "Alakazam_ex_(151_TCG)"
# path_pokemon = "Transferencia_de_Bill_(TCG)"
# url_pokemon = url_base + path_pokemon
# print("URL Pokemon:", url_pokemon)


nombre_coleccion = url_expansion.split("/")[-1].replace("(","_").replace(")","_")  # Obtiene "Base_Set_(TCG)"
print("Nombre coleccion:", nombre_coleccion)

time.sleep(2)  # Esperar a que la página cargue completamente

page = requests.get(url_expansion)
soup = BeautifulSoup(page.content, "html.parser")#.prettify()
# print("Sopa:", soup)

titulo = soup.find("h1", {"id" : "firstHeading"})
# Extraer el título completo
titulo_completo = titulo.text
print("Titulo completo:", titulo_completo)
# Dividir el título por el carácter ':'
partes_titulo = titulo_completo.split(":")

seccion_logo = soup.find("div", {"class" : "contlogo"})
# print("Sección logo:", seccion_logo)

seccion_fecha = soup.find("table", {"class" : "datos"}).find_all("tr")
# Extraer el contenido del elemento <td>
fechas_lanzamiento = seccion_fecha[1].find("td")

# Verificar si se encontraron fechas
if fechas_lanzamiento:
    # Dividir las fechas por el separador <br/>
    fechas = fechas_lanzamiento.decode_contents().split("<br/>")
    
    # Limpiar y asignar las fechas a variables separadas
    fecha_ja = fechas[0].strip().replace("(JA)", "").strip()
    fecha_in_es = fechas[1].strip().replace("(IN/ES)", "").strip()

    # Eliminar espacios extra
    fecha_ja = " ".join(fecha_ja.split())
    fecha_in_es = " ".join(fecha_in_es.split())

    # # Convertir las fechas al formato datetime
    # fecha_ja_obj = datetime.strptime(fecha_ja, "%d de %b. de %Y")
    # fecha_in_es_obj = datetime.strptime(fecha_in_es, "%d de %b. de %Y")

    # # Asegurarse de que las fechas estén en UTC
    # utc = pytz.UTC
    # fecha_ja_obj_utc = utc.localize(fecha_ja_obj)
    # fecha_in_es_obj_utc = utc.localize(fecha_in_es_obj)

    # Imprimir las fechas en UTC
    print("Fecha JA (UTC):", fecha_ja)
    print("Fecha IN/ES (UTC):", fecha_in_es)

else:
    print("No se encontraron fechas.")


logo = None
logo_chiquito = ""
logo_mediano = ""
logo_grande = ""

url_imagen = ""
url_imagen_x2 = ""

if seccion_logo:
    logo = seccion_logo.find("img") 

if logo:
    logo_chiquito = logo.get("src")
    logos = logo.get("srcset")
    logo_mediano = logos.split(",")[0].split(" ")[0]  # Extraer la URL
    logo_grande = logos.split(",")[1].split(" ")[1]  # Extraer la URL

    print(">Logo pequeño:", logo_chiquito)
    print(">Logo mediano:", logo_mediano)
    print(">Logo grande:", logo_grande)
    # print("Sección imagen:", logos)

# Verificar si hay un subtítulo
if len(partes_titulo) > 1:
    generacion = partes_titulo[0].strip()  # Primera parte como título principal
    expansion = partes_titulo[1].strip()  # Segunda parte como subtítulo
    print("Generación:", generacion)
    print("Expansión:", expansion)
else:
    generacion = titulo_completo.strip()  # Solo hay un título principal
    expansion = generacion
    print("Generación:", generacion)
    print("Expansión:", expansion)
    
prueba_ref = db.collection("expansiones").document(nombre_coleccion)

# Escribir un documento de prueba
prueba_ref.set({
    "nombre": titulo_completo if titulo_completo else "",
    "nombre_generacion": generacion if generacion else "",
    "nombre_expansion": expansion if expansion else "",
    "logo_chiquito": logo_chiquito if logo_chiquito else "",
    "logo_mediano": logo_mediano if logo_mediano else "",
    "logo_grande": logo_grande if logo_grande else "",
    "fecha_JA": fecha_ja,
    "fecha_IN_ES": fecha_in_es,
})

    
# Buscar la tabla de cartas
tabla = soup.find("table", class_="wiki sortable")


# Buscar todas las filas de la tabla
filas = tabla.find_all("tr")

## Iterar sobre las filas y extraer el contenido
# for i, fila in enumerate(filas, start=1):
#     print(f"Fila {i}:")
#     print(fila)  # Imprimir el HTML completo de la fila con formato
#     print("-" * 80)

# Crear una lista para almacenar los datos de las cartas
cartas = []

print("------------Información de las cartas-----------------")
for i, fila in enumerate(filas[1:], start=1):  # Saltar la fila de encabezado
    # time.sleep(1)  # Esperar a que la página cargue completamente
    celdas = fila.find_all("td")
    # print("-" * 80)
    # print("Celdas:", len(celdas))
    # print("Celdas:", celdas)
    
    # for j, celda in enumerate(celdas):
    #     print(f"Celda {j}: {celda.text.strip()}")
    #     print("Celda:", celda)
    #     print("-" * 40)

    categoria = ""
    nombre = celdas[1].text.strip()
    codigo = celdas[0].text.strip()
    href = celdas[1].find("a")["href"]
    tipo = celdas[2].find("a")["title"]
    if len(celdas) > 4:
        rareza = celdas[4].find("a")["title"]
        marca = celdas[3].text.strip()
    else:
        try:
            rareza = celdas[3].find("a")["title"]
        except:
            rareza =""
        marca = ""
        
    # if (codigo == '001/189' or codigo == '002/189' or codigo == '175/189'):
    print("-" * 80)
    print("Celdas:", len(celdas))
    # print("Celdas:", celdas)
    
    for j, celda in enumerate(celdas):
        if (j == 1):
            # print(f"Celda {j}: {celda.text.strip()}")
            # print("Celda:", celda)
            for n, c in enumerate(celda):
                # print(">>>>>>>>>>>Nombre", n, " :", c)
                if (n ==0):
                    nombre = c.text.strip()
                    # print("Nombre:", nombre)
                if (n ==1):
                    try:
                        categoria = c["alt"]
                        nombre = nombre + " " + categoria
                    except KeyError:
                        print("Posible energía", c)                            
                        categoria = ""
                    # print("Tipo:", nombre)
                if (n ==2):
                    nombre = nombre + " " + c.text.strip()
                    # print("Continuacion nombre:", nombre)
                # print("-" * 40)
            print("-" * 40)
    # time.sleep(2)
    print("Codigo:", codigo)
    print("Nombre:", nombre)
    print("Nivel:", categoria)
    print("Href:", href)
    print("Tipo:", tipo)
    print("Rareza:", rareza)
    print("Marca:", marca)
    print("Rareza:", rareza)
    
    
    cartas.append({
        "codigo": codigo,
        "nombre": nombre,
        "categoria" : categoria,
        "href": href,
        "tipo": tipo,
        "marca": marca,
        "rareza": rareza
    })
    
    # # print(f"Número: {codigo}, Nombre: {nombre}, Tipo: {tipo}, Marca: {marca}, Rareza: {rareza}")
    # print("Código:", codigo)
    # print("Nombre:", nombre)
    # print("Href:", href)
    # print("Tipo:", tipo)
    # print("Marca:", marca)
    # print("Rareza:", rareza)
    # print("-" * 80)
    

# time.sleep(2)  # Esperar a que la página cargue completamente

# Leer el documento de prueba
doc = prueba_ref.get()
if doc.exists:
    print("Conexión con Firebase verificada correctamente.")
    print(f"Datos del documento: {doc.to_dict()}")
else:
    print("No se pudo leer el documento de prueba. Verifica la conexión.")

def buscarImagenes(codigos, path_pokemon, rarezas, nombres_pokemones, tipos, marcas, niveles):
    print("Buscando imágenes...")
    print("Codigos: ", codigos)
    print("Rarezas: ", rarezas)
    print("Nombres: ", nombres)
    # print("Tipos: ", tipos)
    # print("Marcas: ", marcas)
    print("Niveles: ", niveles)
    for codigo, rareza, nombre_pokemon, tipo, marca, categoria in zip(codigos, rarezas, nombres_pokemones, tipos, marcas, niveles):
        print("|" * 40)
        print("Codigo:", codigo)
        posicion = codigo.split("/")[0]
        coleccion = codigo.split("/")[1]
        # print("Posicion:", posicion)
        # print("Coleccion:", coleccion)
        print("Url completa:", url_base + path_pokemon)
        url_pokemon = url_base + path_pokemon
        time.sleep(1)  # Esperar a que la página cargue completamente

        page = requests.get(url_pokemon)
        soup = BeautifulSoup(page.content, "html.parser") #.prettify()

        content = soup.find("div", {"id" : "mw-content-text"})
        texto = content.find_all("p")[0]

        # print("Texto : ", texto)
        nombre = texto.find("i")
        # print("Nombre : ", nombre)
        if nombre == None:
            nombre_ingles = ""
        else:
            nombre_ingles = nombre.find("b").text

        # print("soup:", soup)

        galeria = soup.find(class_="gallery mw-gallery-nolines")
        # print("galeria:", len(galeria))
        # print("galeria:", galeria)
        # Verificar si galeria es None
        if galeria is None:
            galeria = soup.find(class_="imagen")
            # print("Galeria:", galeria)
            img = galeria.find("img")  # Buscar la imagen dentro del enlace
            print("Imagen:", img)
            srcset = img.get("srcset")
            src = img.get("src")
            print("Src:", src)
            print("Srcset:", srcset)
            try:
                srcset_x2 = srcset.split(",")[1]
            except IndexError:
                srcset_x2 = srcset.split(",")[0]
            print("   - Srcset URLs:")

            url_imagen_x2 = srcset_x2.strip().split(" ")[0]  # Extraer la URL
            url_imagen = src
            print(f"     - {url_imagen_x2}")

        else:
            ediciones = galeria.find_all(class_="gallerybox")
            print("Ediciones:", len(ediciones))
            print("Expansion:", expansion)
            
            # Separar las palabras de las variables
            nombre_ingles_palabras = nombre_ingles.split()  # Divide por espacios
            path_expansion_palabras = expansion.replace("_", " ").split()  # Reemplaza guiones bajos por espacios y divide
            path_pokemon_palabras = path_pokemon.replace("_", " ").split()  # Reemplaza guiones bajos por espacios y divide
            
            # Combinar todas las palabras en una sola variable
            todas_las_palabras = nombre_ingles_palabras + path_expansion_palabras + path_pokemon_palabras + [posicion, coleccion]

            # Imprimir las palabras combinadas
            # print("Todas las palabras:", todas_las_palabras)

            # Acceder a cada palabra por separado
            # print("\nAcceso individual:")
            # for i, palabra in enumerate(todas_las_palabras, start=1):
            #     print(f"Palabra {i}: {palabra}")
                
            # print("//" * 40)
            # Variable para rastrear la edición con más coincidencias
            max_matches = 0
            edicion_con_mas_matches = None

            for i, edicion in enumerate(ediciones, start=1):
                # print("Edición completa ", i, ": ")#, edicion)
                # print("Palabra Bill: ", todas_las_palabras[9])
                
                matches = 0
                
                # Convertir toda la información de la edición a texto
                edicion_completa = str(edicion)  # Convertir el objeto BeautifulSoup a una cadena
                
                for n, palabra in enumerate(todas_las_palabras, start=1):
                    # Verificar si la palabra está en cualquier parte de la edición
                    if palabra in edicion_completa:
                        # print(f"Coincidencia {n}: {palabra}")
                        matches += 1
                
                # print("Coincidencias:", matches)
                
                # Actualizar la edición con más coincidencias
                if matches > max_matches:
                    max_matches = matches
                    edicion_con_mas_matches = edicion
                
                # Obtener la referencia del enlace
                referencia = edicion.find("a", class_="image")
                if referencia:
                    # print(" - Referencia completa ", i, ": ")#, referencia)

                    # Extraer atributos de la referencia
                    href = referencia.get("href")  # Enlace del atributo href
                    title = referencia.get("title")  # Título del atributo title
                    img = referencia.find("img")  # Buscar la imagen dentro del enlace

                    if img:
                        alt = img.get("alt")  # Texto alternativo
                        src = img.get("src")  # URL de la imagen
                        srcset = img.get("srcset")  # Atributo srcset con múltiples resoluciones

                        # Imprimir cada elemento por separado
                        # print("   - Href:", href)
                        # print("   - Title:", title)
                        # print("   - Alt:", alt)
                        # print("   - Src:", src)
                        # print("   - Srcset:", srcset)

                        # Procesar srcset para separar las URLs
                        if srcset:
                            try:
                                partes = srcset.split(",")[1]
                            except IndexError:
                                partes = srcset.split(",")[0]
                            # print("   - Srcset URLs:")

                            url = partes.strip().split(" ")[0]  # Extraer la URL
                            # print(f"     - {url}")
                else:
                    print(f" - Referencia: None (No se encontró un enlace con clase 'image')")
                # print("_" * 40)
                
                

            # Imprimir la información de la edición con más coincidencias
            if edicion_con_mas_matches:
                print("\n" + "=" * 40)
                print("\nEdición con más coincidencias:")
                print("Coincidencias:", max_matches)
                print("Información completa de la edición:")
                # print(edicion_con_mas_matches)
                referencia = edicion_con_mas_matches.find("a", class_="image")
                if referencia:
                    # print(" - Referencia completa: ", referencia)

                    # Extraer atributos de la referencia
                    href = referencia.get("href")  # Enlace del atributo href
                    title = referencia.get("title")  # Título del atributo title
                    img = referencia.find("img")  # Buscar la imagen dentro del enlace

                    if img:
                        alt = img.get("alt")  # Texto alternativo
                        src = img.get("src")  # URL de la imagen
                        srcset = img.get("srcset")  # Atributo srcset con múltiples resoluciones

                        # Imprimir cada elemento por separado
                        # print("   - Href:", href)
                        # print("   - Title:", title)
                        # print("   - Alt:", alt)
                        print("   - Src:", src)
                        url_imagen = src
                        # print("   - Srcset:", srcset)

                        # Procesar srcset para separar las URLs
                        if srcset:
                            try:
                                partes = srcset.split(",")[1]
                            except IndexError:
                                partes = srcset.split(",")[0]
                            # print("   - Srcset URLs:")
                            print("   - Srcset URLs:")

                            url_imagen_x2 = partes.strip().split(" ")[0]  # Extraer la URL
                            print(f"     - {url}")
            else:
                print("\nNo se encontraron coincidencias en ninguna edición.")



        cartas_ref = db.collection("expansiones").document(nombre_coleccion).collection("cartas").document((codigo + path_pokemon).replace("/", "_"))
        cartas_ref.set({
            "nombre_espanol": nombre_pokemon,
            "codigo": codigo,
            "nombre_ingles": nombre_ingles,
            "rareza": rareza,
            "imagen_url_grande": url_imagen_x2,
            "imagen_url": url_imagen,
            "tipo_carta": tipo,
            "categoria": categoria,
            "marca": marca,
            "estado": "pendiente",
            "expansion": titulo_completo
        })
        print("Nombre Inglés:", nombre_ingles)
        print("Rareza:", rareza)
        print("Codigo:", codigo)
        print("Path Pokemon:",(codigo + path_pokemon).replace("/", "_"))
        print("Url Imagen:", url_imagen_x2)

# Agrupar las cartas por nombre_espanol
cartas_agrupadas = {}

for carta in cartas:
    # print("Código:", carta["codigo"])   
    # print("Nombre:", carta["nombre"])
    # print("Href:", carta["href"])
    # print("Tipo:", carta["tipo"])
    # print("Marca:", carta["marca"])
    # print("Rareza:", carta["rareza"])
    # print("-" * 80)
    nombre = carta["href"]
    if nombre not in cartas_agrupadas:
        cartas_agrupadas[nombre] = []
    cartas_agrupadas[nombre].append(carta)
    

# Imprimir la información de cartas_agrupadas ordenadamente
for path_pokemon, cartas in cartas_agrupadas.items():
    print(f"Nombre: {path_pokemon}")

    print("Cartas:")
    codigos = []
    rarezas = []
    nombres = []
    tipos = []
    niveles = []
    marcas = []
    for carta in cartas:
        print(f"  - Código: {carta['codigo']}")
        codigos.append(carta["codigo"])
        rarezas.append(carta["rareza"])
        nombres.append(carta["nombre"])
        tipos.append(carta["tipo"])
        niveles.append(carta["categoria"])
        marcas.append(carta["marca"])
        
        print(f"    Nombre: {carta['nombre']}")
        print("    Codigo:", carta['codigo'])
        print(f"    Href: {carta['href']}")
        print(f"    Tipo: {carta['tipo']}")
        print(f"    Nivel: {carta['categoria']}")
        print(f"    Marca: {carta['marca']}")
        print(f"    Rareza: {carta['rareza']}")
        print("-" * 40)
    buscarImagenes(codigos, path_pokemon, rarezas, nombres, tipos, marcas, niveles)
    print("=" * 80)