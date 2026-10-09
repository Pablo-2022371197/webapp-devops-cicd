# Práctica DevOps — Protocolo TCP en puerto 6061

**Universidad Tecnológica de Querétaro**  
**Materia:** Gestión del Proceso de Desarrollo de Software  
**Docente:** Emmanuel Martinez Hernandez  
**Estudiante:** Pablo Abraham Guerrero Alvarado  
**Matrícula:** 2022371197

## Descripción

Se extendió la aplicación para atender comandos por **socket TCP** en el puerto **6061**, en el **mismo contenedor** que el API HTTP. Ambos protocolos comparten SQLite: un registro insertado por TCP es visible con `{get}` o con `GET /users` y `GET /products`.

| Canal | Puerto en EC2 | Uso |
|-------|---------------|-----|
| HTTP  | 8080          | REST |
| TCP   | 6061          | `{insert:entidad:json}`, `{get:entidad}`, `{get:entidad:id}` |

Entidades: `users` y `products`. Respuesta: `{ statusCode, data }`.

## Evidencias

### 1. Build y publicación en Docker Hub

![Build y push de webapp:v5](evidencias/image1.png)

Imagen `pablo2022371197/webapp:v5` construida y publicada en Docker Hub.

### 2. Contenedor en EC2

![docker ps en EC2](evidencias/image4.png)

En la instancia, `intro-backend` corre con `webapp:v5` y publica **8080** (HTTP) y **6061** (TCP).

### 3. Insert por TCP

![Insert TCP de usuario Ana](evidencias/image2.png)

Comando enviado a `3.15.43.13:6061`:

```text
{insert:users:{"name":"Ana","email":"ana@mail.com"}}
```

Respuesta: `statusCode` 200, usuario creado con `id: 3`.

### 4. Get por TCP

![Get TCP de users](evidencias/image3.png)

```text
{get:users}
```

Respuesta: `statusCode` 200 con el listado de usuarios almacenados en SQLite.

## Conclusión

HTTP y TCP conviven en un solo contenedor y en la misma base de datos. El ciclo quedó evidenciado: publicación de `webapp:v5`, contenedor `intro-backend` en EC2 con ambos puertos, e insert/get por socket 6061 con respuestas 200.
