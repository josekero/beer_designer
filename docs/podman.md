# Despliegue local con Podman

Esta versión empaqueta el frontend Angular, una base de datos PostgreSQL local y un backend Spring Boot. El frontend se sirve con Nginx como SPA, mientras que el backend expone una API REST sobre PostgreSQL.

## Requisitos

- Podman instalado en `/Users/jaquero/Documents/Applications/homebrew/bin/podman`
- Podman machine arrancada en macOS

Comprueba Podman:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman --version
```

Si la máquina no está arrancada:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start
```

## Construir la imagen

Desde la raíz del proyecto:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman build -t beer-designer-frontend:local .
```

La primera vez descargará las imágenes base `node:24.13.1-alpine` y `nginx:1.27-alpine`.

## Levantar la aplicación

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman run --rm \
  --name beer-designer-frontend \
  -p 8080:80 \
  beer-designer-frontend:local
```

Abre:

```txt
http://localhost:8080
```

Si el puerto `8080` está ocupado, usa otro puerto local. Por ejemplo:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman run -d --replace \
  --name beer-designer-frontend \
  -p 8081:80 \
  beer-designer-frontend:local
```

Abre:

```txt
http://localhost:8081
```

## PostgreSQL local

El proyecto incluye un servicio `postgres` en `compose.yaml` y scripts de inicialización en `db/init`.

Credenciales locales:

```txt
DB: beerdb
USER: beeruser
PASSWORD: beerpass
HOST: localhost
PORT: 5432
```

Schema y seed:

```txt
db/init/01_schema.sql
db/init/02_seed_catalog.sql
```

El seed se genera desde los XML actuales:

```bash
node scripts/generate-postgres-seed.mjs
```

### Levantar PostgreSQL con Podman directo

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman volume create beer_postgres_data

/Users/jaquero/Documents/Applications/homebrew/bin/podman run -d --replace \
  --name beer-designer-postgres \
  -e POSTGRES_DB=beerdb \
  -e POSTGRES_USER=beeruser \
  -e POSTGRES_PASSWORD=beerpass \
  -p 5432:5432 \
  -v beer_postgres_data:/var/lib/postgresql/data \
  -v /Users/jaquero/Documents/angular_ws/beerProject/db/init:/docker-entrypoint-initdb.d:ro \
  docker.io/library/postgres:16-alpine
```

Verifica que acepta conexiones:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman exec beer-designer-postgres pg_isready -U beeruser -d beerdb
```

Consulta conteos básicos:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman exec beer-designer-postgres \
  psql -U beeruser -d beerdb \
  -c "SELECT 'bjcp_styles' AS table_name, count(*) FROM bjcp_styles UNION ALL SELECT 'recipes', count(*) FROM recipes;"
```

Parar PostgreSQL:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman stop beer-designer-postgres
```

Eliminar los datos persistidos y forzar que se vuelvan a ejecutar los scripts `db/init`:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman stop beer-designer-postgres
/Users/jaquero/Documents/Applications/homebrew/bin/podman volume rm beer_postgres_data
```

## Alternativa con compose

Este repositorio incluye `compose.yaml` con `frontend`, `postgres` y `backend`. Cuando Podman tenga un proveedor de compose disponible, puedes levantar todo así:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman compose up --build
```

Y pararlo con:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman compose down
```

Nota: `podman compose` necesita un proveedor externo como `podman-compose` o `docker-compose`. Si ves `looking up compose provider failed`, usa los comandos directos de `podman run` de esta guía o instala un proveedor de compose.

## Backend Spring Boot

El backend vive en `backend/` y expone API REST sobre PostgreSQL.

Compilar localmente:

```bash
cd /Users/jaquero/Documents/angular_ws/beerProject/backend
mvn -B package -DskipTests
```

Arrancar localmente contra el Postgres publicado en `localhost:5432`:

```bash
cd /Users/jaquero/Documents/angular_ws/beerProject/backend
SERVER_PORT=8082 java -jar target/beer-designer-backend-0.1.0-SNAPSHOT.jar --debug=false
```

Endpoints principales:

```txt
http://localhost:8082/api/health
http://localhost:8082/actuator/health
http://localhost:8082/api/catalog/bjcp-styles
http://localhost:8082/api/catalog/hops
http://localhost:8082/api/catalog/malts
http://localhost:8082/api/catalog/yeasts
http://localhost:8082/api/catalog/water-profiles
http://localhost:8082/api/recipes
http://localhost:8082/api/recipes/sample-american-ipa
```

Construir imagen del backend:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman build -t beer-designer-backend:local ./backend
```

Arrancar backend en contenedor contra el Postgres ya publicado en el host:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman run -d --replace \
  --name beer-designer-backend \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.containers.internal:5432/beerdb \
  -e SPRING_DATASOURCE_USERNAME=beeruser \
  -e SPRING_DATASOURCE_PASSWORD=beerpass \
  -p 8082:8080 \
  beer-designer-backend:local
```

Verificar:

```bash
curl -s http://localhost:8082/api/health
curl -s http://localhost:8082/api/recipes
```

## Parar el contenedor

En otra terminal:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman stop beer-designer-frontend
```

## Verificar que responde

```bash
curl -I http://localhost:8081/
```

Respuesta esperada:

```txt
HTTP/1.1 200 OK
Server: nginx
```

## Ver contenedores e imágenes

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman ps
/Users/jaquero/Documents/Applications/homebrew/bin/podman images
```

## Reconstruir después de cambios

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman build -t beer-designer-frontend:local .
/Users/jaquero/Documents/Applications/homebrew/bin/podman run --rm --name beer-designer-frontend -p 8080:80 beer-designer-frontend:local
```

Si el contenedor anterior sigue activo:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman stop beer-designer-frontend
```

## Troubleshooting de la VM de Podman

En macOS, Podman usa una VM Linux. Si ves algo como:

```txt
Cannot connect to Podman socket
vfkit exited unexpectedly
Currently starting
ssh: handshake failed
```

comprueba el estado:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine list
/Users/jaquero/Documents/Applications/homebrew/bin/podman system connection list
```

### Podman 6, libkrun y `krunkit`

Con Podman 6 puede aparecer este error al arrancar la machine:

```txt
Error: exec: "krunkit": executable file not found in $PATH
```

Eso significa que la VM se creó con provider `libkrun`, pero falta el binario `krunkit`. En este entorno Homebrew lo muestra como:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/brew search krun
```

Solución:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/brew install slp/krunkit/krunkit
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start podman-machine-default
```

Alternativa, si prefieres no instalar `krunkit`, es crear una machine con provider `applehv`:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine init --provider applehv --cpus 4 --memory 4096 --disk-size 40 beer-applehv
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start beer-applehv
```

Intenta arrancarla:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start podman-machine-default
```

Si queda bloqueada en `Currently starting`, prueba un reinicio de la VM:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine stop podman-machine-default
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start podman-machine-default
```

Si aun así falla, la opción limpia es recrear la machine, pero eso puede borrar imágenes y contenedores de esa VM:

```bash
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine rm podman-machine-default
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine init
/Users/jaquero/Documents/Applications/homebrew/bin/podman machine start
```

Haz esto último solo si no tienes nada importante dentro de esa machine.
