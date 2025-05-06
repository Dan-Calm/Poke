import requests
from bs4 import BeautifulSoup
import re
import time

import json

import firebase_admin
from firebase_admin import credentials, firestore
from cargarColecciones import cargar_todas_las_colecciones  # Importar la función desde cargarColecciones.py

from datetime import datetime

# Convertir la fecha al formato solicitado
def formatear_fecha(fecha_iso):
    try:
        fecha = datetime.strptime(fecha_iso, "%Y-%m-%dT%H:%M:%S.%fZ")
        return fecha.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        # Manejar fechas sin milisegundos
        fecha = datetime.strptime(fecha_iso, "%Y-%m-%dT%H:%M:%SZ")
        return fecha.strftime("%Y-%m-%d %H:%M:%S")



# Cargar todas las colecciones y sus cartas usando la función cargar_todas_las_colecciones
from cargarColecciones import cargar_todas_las_colecciones  # Importar la función desde cargarColecciones.py
todas_las_cartas = cargar_todas_las_colecciones()

# Verificar si Firebase ya está inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate("../config/serviceAccountKey.json")  # Cambia esto por la ruta a tu archivo JSON de credenciales
    firebase_admin.initialize_app(cred)

# Inicializar Firestore
db = firestore.client()

tienda_ref = db.collection("tiendas").document("productos_tcgmatch")
tienda_ref.set({
    "nombre": "TCG Match",
})

def consultar_tcgmatch_con_bs4():
    url = "https://tcgmatch.cl/producto/680a693bcbad0cb599247684"
    
    try:
        # Realizar la solicitud GET a la página
        response = requests.get(url)
        
        # Verificar si la solicitud fue exitosa
        if response.status_code == 200:
            # Parsear el contenido HTML con BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')
            
            id_documento = url.replace("/","").replace(":", "").replace(".","")
            
            # Extraer los campos relevantes
            script_data = soup.find('script', {'id': '__NEXT_DATA__'}).string
            data = json.loads(script_data)
            card_name = data['props']['pageProps']['product'].get('name', 'Desconocido')
            
            # Extraer el tipo de la carta usando una expresión regular
            tipo_carta = "Sin tipo"
            match_tipo = re.search(r"\b(Ex|V|VSTAR|GX|VMAX|G LV.X)\b", card_name, re.IGNORECASE)  # Busca los tipos en el nombre
            if match_tipo:
                tipo_carta = match_tipo.group(0).upper()

            card_image_small = soup.find('meta', {'property': 'og:image'})['content']

            card_data = data['props']['pageProps']['product']['card']
            
            # Extraer información adicional
            card_number = card_data['data']['number']
            card_rarity = card_data['data']['rarity']
            set_name = card_data['data']['set']['name']
            printed_total = card_data['data']['set']['printedTotal']
            
            last_price = card_data['lastPrice']
            market_price = card_data['tcgmatch']['marketPrice']
            price_history = card_data['price_history']
            
            codigo_carta = f"{card_number}/{printed_total}"
            
            carta_existente = next((carta for carta in todas_las_cartas if carta["codigo"] == codigo_carta), None)
            coleccion = carta_existente["id"] if carta_existente else ""
            
            # Mostrar la información extraída
            print("=" * 50)
            print(f"Nombre de la carta: {card_name}")
            print(f"ID del documento: {id_documento}")
            print(f"Tipo de carta: {tipo_carta}")
            print(f"Set: {set_name}")
            print(f"Código: {card_number}/{printed_total}")
            print(f"Rareza: {card_rarity}")
            print(f"Imagen (pequeña): {card_image_small}")
            print(f"Último precio: ${last_price}")
            print(f"Precio de mercado: ${market_price}")
            print("\nHistorial de precios:")
            
            n= 0
            for entry in price_history:
                date = entry.get('date')
                price = entry.get('price')
                print(f"  - Fecha {n}: {date}, Precio: ${price}")
                n += 1
                
                
            producto_ref = tienda_ref.collection("productos").document(id_documento)
            producto_ref.set({
                "codigo_carta" : codigo_carta,
                "coleccion":coleccion,
                "imagen": card_image_small,
                "link": url,
                "nombre": card_name,
                "nombre_limpio": card_name,
                "precio": market_price,
                "tienda":"TCG Match",
                "tipo_carta": tipo_carta,
            })
            print(f"Producto guardado en Firestore con ID: {id_documento}")
            
            i = 0
            while i < len(price_history):
                fecha_inicial = formatear_fecha(price_history[i]["date"])
                print(f"Fecha inicial {i}: {fecha_inicial}")
                check = False
                while check == False:
                    time.sleep(0.5)  # Esperar 0.1 segundos
                    if (price_history[i]["price"] == price_history[i+1]["price"]):
                        i += 1
                    else:
                        check = True
                        i += 1
                fecha_final = formatear_fecha(price_history[i]["date"])
                print(f"Fecha final: {fecha_final}")
                precio = price_history[i]["price"]
                print("Precio: ", price_history[i]["price"])
                print("_" * 50)
                precios_ref = producto_ref.collection("precios")
                precios_ref.add({
                    "fecha_inicial": fecha_inicial,
                    "fecha_final": fecha_final,
                    "precio": precio,
                })
                print(f"-----Precio guardado en Firestore con ID: {id_documento}")
                
            
        else:
            print(f"Error al consultar la página. Código de estado: {response.status_code}")
    except Exception as e:
        print(f"Error al realizar la solicitud: {e}")

# Llamar a la función
consultar_tcgmatch_con_bs4()