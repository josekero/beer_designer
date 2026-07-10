# Beer Designer

Aplicacion para disenar recetas de cerveza artesanal con referencia BJCP 2021, calculos cerveceros y catalogos de ingredientes.

## Stack

- Frontend: Angular 21 con componentes standalone y formularios reactivos.
- Backend: Java 21 + Spring Boot + Spring Data JPA/Hibernate.
- Base de datos: PostgreSQL 16.
- Contenedores: Podman/Docker.
- Datos iniciales: scripts SQL generados desde los catalogos XML de `public/assets/data`.

## Funcionalidad actual

- Dashboard con estilos BJCP 2021 navegables.
- Lista y detalle de recetas de ejemplo.
- Creacion/edicion de recetas en frontend.
- Calculos de OG, FG, ABV, IBU y SRM.
- Comparacion de receta contra rangos BJCP.
- Catalogos de estilos, lupulos, maltas, levaduras y perfiles de agua.
- Backend REST con lectura desde PostgreSQL.

## Desarrollo frontend

Instala dependencias:

```bash
npm install
```

Arranca Angular:

```bash
npm start
```

Abre:

```txt
http://localhost:4200
```

Build de produccion:

```bash
npm run build
```

## Backend

Compila el backend:

```bash
cd backend
mvn -B package -DskipTests
```

Arranca el backend contra PostgreSQL local:

```bash
cd backend
SERVER_PORT=8082 java -jar target/beer-designer-backend-0.1.0-SNAPSHOT.jar --debug=false
```

Endpoints principales:

```txt
GET http://localhost:8082/api/health
GET http://localhost:8082/actuator/health
GET http://localhost:8082/api/catalog/bjcp-styles
GET http://localhost:8082/api/catalog/hops
GET http://localhost:8082/api/catalog/malts
GET http://localhost:8082/api/catalog/yeasts
GET http://localhost:8082/api/catalog/water-profiles
GET http://localhost:8082/api/recipes
GET http://localhost:8082/api/recipes/sample-american-ipa
```

## Podman

La guia completa para construir y levantar frontend, PostgreSQL y backend esta en:

```txt
docs/podman.md
```

Estado local usado durante el desarrollo:

```txt
Frontend: http://localhost:8081
Backend:  http://localhost:8082
Postgres: localhost:5432
```

## Despliegue QNAP / GHCR

El workflow de GitHub publica dos imagenes:

```txt
ghcr.io/josekero/beer_designer:latest
ghcr.io/josekero/beer_designer-backend:latest
```

Para Container Station usa `compose.qnap.yaml`. Ese compose levanta:

```txt
frontend -> Nginx + Angular, puerto 8081
backend  -> Spring Boot + Flyway, interno en puerto 8080
postgres -> PostgreSQL 16 oficial
```

El frontend llama a la API con ruta relativa `/api`. Nginx reenvia esa ruta al servicio interno `backend:8080`, por eso no debe aparecer `localhost:8082` dentro del bundle de produccion.

En QNAP no hace falta montar `./db/init`: el backend lleva las migraciones Flyway dentro de `src/main/resources/db/migration` y las aplica al arrancar.

Si Container Station creo un volumen `postgres_data` durante un intento fallido con una base parcialmente inicializada, elimina ese volumen antes de volver a desplegar para forzar una inicializacion limpia.

El backend espera hasta 120 segundos a que PostgreSQL este disponible antes de fallar. Ademas, `compose.qnap.yaml` incluye healthchecks para ordenar mejor el arranque:

```txt
postgres healthy -> backend healthy -> frontend
```

## Base de datos

Los scripts de inicializacion viven en:

```txt
db/init/01_schema.sql
db/init/02_seed_catalog.sql
```

Regenerar seed desde los datos XML:

```bash
node scripts/generate-postgres-seed.mjs
```

## GitHub

El repositorio ya esta inicializado con rama `main`.

Primer commit:

```bash
git add .
git commit -m "Initial beer designer stack"
```

Conectar con GitHub:

```bash
git remote add origin git@github.com:TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si prefieres HTTPS:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```
