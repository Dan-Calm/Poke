# Imagen base de Node.js
FROM node:18-alpine

# Directorio dentro del contenedor
WORKDIR /app

# Copiamos el proyecto completo
COPY . .

# Instalamos dependencias
RUN npm install

# Compilamos la app
RUN npm run build

# Instalar "serve" para servir archivos estáticos
RUN npm install -g serve

# Comando que se ejecuta cuando el container inicia
CMD ["serve", "-s", "www", "-l", "8080"]
