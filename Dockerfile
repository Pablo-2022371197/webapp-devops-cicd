FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer HTTP y TCP
EXPOSE 80 6061

# Iniciar la aplicación
CMD ["node", "index.js"]