from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from bs4 import BeautifulSoup

from collections import defaultdict
import re
import json

from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase solo si no está inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate("../config/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

from cargar_expansiones import cargar_todas_las_colecciones
todas_las_cartas = cargar_todas_las_colecciones()  # Obtener todas las cartas de todas las colecciones

options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
url = "https://tcgmatch.cl/producto/680a693bcbad0cb599247684"
driver.get(url)
time.sleep(5)
html = driver.page_source
driver.quit()

soup = BeautifulSoup(html, "html.parser")

# Buscar el script con el JSON de Next.js
script_tag = soup.find("script", id="__NEXT_DATA__")
if script_tag:
    data = json.loads(script_tag.string)
    try:
        card_data = data["props"]["pageProps"]["product"]["card"]["data"]
        nombre_carta = card_data.get("name", "")
        edicion = card_data.get("set", {}).get("name", "") or card_data.get("edition", "")
        rareza = card_data.get("rarity", "")
        # Obtener el número completo (ej: "238/191")
        codigo = card_data.get("number", "")
        # Si existe el campo 'set' con 'printedTotal', usarlo para formar el número completo
        if "/" not in codigo:
            printed_total = card_data.get("set", {}).get("printedTotal", "")
            if printed_total:
                codigo = f"{codigo}/{printed_total}"
        img_url = card_data.get("images", {}).get("small", "")
        
        match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX|G LV.X)\b", nombre_carta, re.IGNORECASE)  # Busca los tipos en el nombre_carta
        if match_tipo:
            tipo_carta = match_tipo.group(0).upper()  # Convertir a mayúsculas para uniformidad
            
        
        # Buscar si el código ya existe en todas_las_cartas
        candidatos_match = [carta for carta in todas_las_cartas if carta["codigo"] == codigo]
        print("--" * 40)
        print(f"Producto encontrado: {nombre_carta}")
        print(f"Candidatos a match para el código o nombre '{codigo}' / '{nombre_carta}':")
        for candidato in candidatos_match:
            print(candidato)
        
        # Comparar palabras en común entre el nombre_carta y el nombre_espanol de los candidatos
        def palabras_en_comun(texto1, texto2):
            palabras1 = set(texto1.lower().split())
            palabras2 = set(texto2.lower().split())
            return len(palabras1 & palabras2)  # Retorna el número de palabras en común
        
        # Determinar el mejor match basado en palabras en común
        mejor_match = None
        max_palabras_comunes = 0
        
        for candidato in candidatos_match:
            palabras_comunes = palabras_en_comun(nombre_carta, candidato["nombre_espanol"])
            print(f"Comparando con: {candidato['nombre_espanol']}, Palabras en común: {palabras_comunes}")
            if palabras_comunes > max_palabras_comunes:
                max_palabras_comunes = palabras_comunes
                mejor_match = candidato
        
        if mejor_match:
            print(f"Mejor match encontrado: {mejor_match['id']}")
        else:
            print("No se encontró un match claro.")
        
        # Preparar el campo Colección
        coleccion = mejor_match["id"] if mejor_match else ""

        # print("Detalle de la carta")
        # print(f"Nombre: {nombre_carta}")
        # print(f"Colección: {coleccion}")
        # print(f"Edición: {edicion}")
        # print(f"Rareza: {rareza}")
        # print(f"Número: {codigo}")
        # print(f"Imagen pequeña del producto: {img_url}")
        # print("" + "-" * 40)
    except Exception as e:
        print("No se pudo extraer el detalle de la carta:", e)
else:
    print("No se encontró el script __NEXT_DATA__")

# Buscar la sección de vendedores
vendedores_section = soup.find("div", id="others")
if vendedores_section:
    vendedores = vendedores_section.find_all("li")
    print(f"Vendedores encontrados: {len(vendedores)}")
    vendedores_info = []
    for idx, vendedor in enumerate(vendedores, 1):
        # Imagen
        img_tag = vendedor.find("img", alt="Imagen del producto")
        imagen = img_tag["src"] if img_tag else ""

        # Nombre
        nombre_tag = vendedor.find("p", class_="font-medium")
        nombre = nombre_tag.text.strip() if nombre_tag else ""

        # Ciudad (dentro de <div class="flex">, el <p> después del icono)
        ciudad = ""
        divs_flex = vendedor.find_all("div", class_="flex")
        for div in divs_flex:
            p_tags = div.find_all("p", class_="ml-1 text-sm font-light ")
            if p_tags:
                ciudad = p_tags[0].text.strip()
                break

        # Idioma y tipo (Español, Holo, etc) - están en <span> dentro de la segunda columna
        idioma_tipo_tags = vendedor.select("div.flex.flex-col.justify-center div.flex.gap-1 span")
        idioma = idioma_tipo_tags[0].text.strip() if len(idioma_tipo_tags) > 0 else ""
        tipo = idioma_tipo_tags[1].text.strip() if len(idioma_tipo_tags) > 1 else ""
        
        divs_gap = vendedor.find_all("div", class_="flex gap-1")
        for div in divs_gap:
            spans = div.find_all("span")
            if spans:
                idioma = spans[0].text.strip()
                if len(spans) > 1:
                    tipo = spans[1].text.strip()
                break

        # Estado (en <p> que contiene "Estado:")
        estado_tag = vendedor.find("p", string=lambda t: t and "Estado:" in t)
        estado = estado_tag.text.replace("Estado:", "").strip() if estado_tag else ""

        # Precio (en <p> con class que contiene "text-green-800")
        precio_tag = vendedor.find("p", class_=lambda c: c and "text-green-800" in c)
        precio = precio_tag.text.strip() if precio_tag else ""

        # Cantidad disponible (en <p> que contiene "Cantidad disponible:")
        cantidad_tag = vendedor.find("p", string=lambda t: t and "Cantidad disponible:" in t)
        cantidad = cantidad_tag.text.replace("Cantidad disponible:", "").strip() if cantidad_tag else ""

        vendedor_dict = {
            "Imagen": imagen,
            "Nombre": nombre,
            "Ciudad": ciudad,
            "Idioma": idioma,
            "Tipo": tipo,
            "Estado": estado,
            "Precio": precio,
            "Cantidad": cantidad
        }
        vendedores_info.append(vendedor_dict)

        # print(f"Vendedor {idx}:")
        # print("  Imagen:", imagen)
        # print("  Nombre:", nombre)
        # print("  Ciudad:", ciudad)
        # print("  Idioma:", idioma)
        # print("  Tipo:", tipo)
        # print("  Estado:", estado)
        # print("  Precio:", precio)
        # print("  Cantidad disponible:", cantidad)
        # print("-" * 40)


    # Agrupar por Idioma y calcular precio medio
    agrupado_idioma = defaultdict(list)
    for v in vendedores_info:
        agrupado_idioma[v["Idioma"]].append(v)

    print("\n=== Resumen por Idioma ===")
    for idioma, lista in agrupado_idioma.items():
        precios = []
        for v in lista:
            # Extraer número del precio (ej: "$210.000 CLP" -> 210000)
            match = re.search(r'[\d\.]+', v["Precio"].replace('.', ''))
            if match:
                precios.append(int(match.group().replace('.', '')))
        precio_medio = int(sum(precios) / len(precios)) if precios else 0
        precio_medio_str = f"${precio_medio:,} CLP".replace(",", ".")
        print("-" * 40)
        print(f"\nCódigo carta: {codigo}")
        print(f"Colección: {coleccion}")
        print(f"Idioma: {idioma}")
        print(f"Imagen: {img_url}")
        print(f"Link: {url}")
        print(f"Nombre: {nombre_carta}")
        print(f"Nombre limpio: {nombre_carta}")
        print(f"Precio: {precio_medio_str}")
        print(f"Stock: {len(lista)}")
        print(f"Tipo carta: {tipo_carta}")
        print("Tienda: TCGMatch")
        
            # ID único para el producto
        id_documento = f"tcgmatch_{codigo.replace('/', '_')}_{nombre_carta.replace(' ', '_').lower()}_{idioma.lower()}"
        tienda_ref = db.collection("tiendas").document("productos_tcgmatch")
        tienda_ref.set({
            "nombre": "TCGMatch",
        })
        producto_ref = tienda_ref.collection("productos").document(id_documento)

        # Guardar/actualizar datos principales del producto
        producto_ref.set({
            "codigo_carta": codigo,
            "coleccion": coleccion,
            "idioma": idioma,
            "imagen": img_url,
            "link": url,
            "nombre": nombre_carta,
            "nombre_limpio": nombre_carta,
            "precio": precio_medio,
            "stock": len(lista),
            "tipo_carta": tipo_carta,
            "tienda": "TCGMatch",
            "id_tienda": "productos_tcgmatch",
        }, merge=True)

        # Guardar historial de precios
        precios_ref = producto_ref.collection("precios")
        docs_precio = list(precios_ref.order_by("fecha_inicio", direction=firestore.Query.DESCENDING).limit(1).stream())
        fecha_actual = datetime.now()
        if docs_precio and docs_precio[0].to_dict().get("precio") == precio_medio:
            # Si el precio no cambió, solo actualiza la fecha_final
            precios_ref.document(docs_precio[0].id).update({"fecha_final": fecha_actual})
        else:
            # Si cambió, agrega un nuevo registro
            precios_ref.add({
                "precio": precio_medio,
                "precio_str": precio_medio_str,
                "fecha_inicio": fecha_actual,
                "fecha_final": fecha_actual
            })

        # Guardar historial de stock
        stocks_ref = producto_ref.collection("stocks")
        docs_stock = list(stocks_ref.order_by("fecha_inicio", direction=firestore.Query.DESCENDING).limit(1).stream())
        if docs_stock and docs_stock[0].to_dict().get("stock") == len(lista):
            stocks_ref.document(docs_stock[0].id).update({"fecha_final": fecha_actual})
        else:
            stocks_ref.add({
                "stock": len(lista),
                "fecha_inicio": fecha_actual,
                "fecha_final": fecha_actual
            })
            
        print(f"Documento guardado/actualizado con ID: {id_documento}")       
        
        # for v in lista:
        #     print(f"    - {v['Nombre']} | {v['Precio']} | {v['Estado']}")

else:
    print("No se encontró la sección de vendedores.")