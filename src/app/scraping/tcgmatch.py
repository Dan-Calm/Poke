import requests
import json

def consultar_api_tcgmatch():
    url = "https://tcgmatch.cl/api/cards/6731cd4bc90676adeeafd423"
    
    try:
        # Realizar la solicitud GET a la API
        response = requests.get(url)
        
        # Verificar si la solicitud fue exitosa
        if response.status_code == 200:
            # Convertir la respuesta a JSON
            data = response.json()
            
            # Extraer y organizar la información relevante
            card_data = data.get('card', {})
            card_name = card_data.get('data', {}).get('name', 'Desconocido')
            set_name = card_data.get('data', {}).get('set', {}).get('name', 'Desconocido')
            last_price = card_data.get('lastPrice', 'N/A')
            market_price = card_data.get('tcgmatch', {}).get('marketPrice', 'N/A')
            price_history = card_data.get('price_history', [])
            products = card_data.get('products', [])
            
            # Información adicional solicitada
            card_number = card_data.get('data', {}).get('number', 'Desconocido')
            card_rarity = card_data.get('data', {}).get('rarity', 'Desconocido')
            card_image_small = card_data.get('data', {}).get('images', {}).get('small', 'No disponible')
            
            printed_total = card_data.get('data', {}).get('set', {}).get('printedTotal', 'Desconocido')
            print("=" * 50)
            
            # Mostrar información general de la carta
            print(f"Nombre de la carta: {card_name}")
            print(f"Set: {set_name}")
            print(f"Número: {card_number}")
            print("Printed Total:", printed_total)  # Debugging line to check the printed total
            print(f"Rareza: {card_rarity}")
            print(f"Imagen (pequeña): {card_image_small}")
            print(f"Último precio: ${last_price}")
            print(f"Precio de mercado: ${market_price:.2f}")
            print("\nHistorial de precios:")
            
            # Mostrar historial de precios
            for entry in price_history:
                date = entry.get('date', 'Sin fecha')
                price = entry.get('price', 'N/A')
                print(f"  - Fecha: {date}, Precio: ${price}")
            
            print("\nProductos disponibles:")
            
            # Mostrar productos disponibles
            for product in products:
                seller = product.get('user', {}).get('name', 'Desconocido')
                price = product.get('price', 'N/A')
                quantity = product.get('quantity', 'N/A')
                status = product.get('status', 'Desconocido')
                language = product.get('language', 'Desconocido')
                print(f"  - Vendedor: {seller}, Precio: ${price}, Cantidad: {quantity}, Estado: {status}, Idioma: {language}")
        else:
            print(f"Error al consultar la API. Código de estado: {response.status_code}")
    except Exception as e:
        print(f"Error al realizar la solicitud: {e}")

# Llamar a la función
consultar_api_tcgmatch()