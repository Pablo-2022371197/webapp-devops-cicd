# webapp-devops-cicd

API REST (Express + SQLite) con canal TCP auxiliar. El objetivo del repositorio es el ciclo de vida DevOps: pruebas automatizadas, imagen Docker y despliegue en AWS EC2.

## Arquitectura

```text
Cliente HTTP  --->  :80   Express  /api/*
Cliente TCP   --->  :6061 protocolo {insert|get}
                         |
                         v
                      SQLite (users, products)
```

| Canal | Puerto del contenedor | Uso |
|-------|----------------------|-----|
| HTTP  | 80                   | API REST bajo `/api` |
| TCP   | 6061                 | `{insert:entidad:json}`, `{get:entidad}`, `{get:entidad:id}` |

Respuesta uniforme: `{ statusCode, data }`.

## Endpoints HTTP

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/users` | Lista usuarios |
| GET | `/api/users/:id` | Usuario por id |
| POST | `/api/users` | Crea usuario `{ name, email }` |
| PUT | `/api/users/:id` | Actualiza usuario |
| DELETE | `/api/users/:id` | Elimina usuario |
| GET | `/api/products` | Lista productos |
| GET | `/api/products/:id` | Producto por id |
| POST | `/api/products` | Crea producto `{ name, price }` |
| PUT | `/api/products/:id` | Actualiza producto |
| DELETE | `/api/products/:id` | Elimina producto |
| GET | `/api/backup` | Descarga respaldo SQLite |
| DELETE | `/api/empty` | Vacía ambas tablas |

## Requisitos locales

- Node.js 18+
- pnpm 11+ (o npm)
- Docker (opcional)

## Comandos locales

```bash
pnpm install
pnpm test
pnpm start
```

`pnpm test` ejecuta Jest + Supertest, imprime cobertura y **falla si el umbral global baja del 70%**.

Por defecto el proceso escucha en el puerto **80** (HTTP) y **6061** (TCP). En Windows local conviene:

```bash
$env:HTTP_PORT=3000
pnpm start
```

Luego: `http://localhost:3000/api/health`.

Variables de entorno:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `HTTP_PORT` | `80` | Puerto HTTP |
| `TCP_PORT` | `6061` | Puerto TCP |

No commitear `.env`, claves SSH, tokens ni IPs de producción. Esos datos van en **GitHub Secrets** cuando se active CI/CD.

## Docker

```bash
docker build -t webapp-devops-cicd:local .
docker run --rm -p 80:80 -p 6061:6061 webapp-devops-cicd:local
```

O con Compose (publica el host en el puerto 80):

```bash
docker compose up --build
```

Comprobar:

```bash
curl http://localhost/api/health
```

La imagen de producción solo copia `index.js` y `src/`. Pruebas, docs y `node_modules` de desarrollo quedan fuera (`.dockerignore`).

## Pruebas y cobertura

- Suite HTTP: `tests/http.endpoints.test.js`
- Protocolo TCP: `tests/protocol.test.js` y `tests/tcp.test.js`
- Formato de respuesta: `tests/format.test.js`

El reporte textual aparece en la consola. El detalle HTML/LCOV queda en `coverage/` (ignorado por git).

## Configuración prevista de CI/CD (GitHub Actions)

Pendiente de implementar el workflow. Cuando se agregue `.github/workflows/main.yml` hará falta configurar secrets (sin ponerlos en el código):

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN` (PAT)
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY` (contenido del `.pem`)

## Licencia

ISC
