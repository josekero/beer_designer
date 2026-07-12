# Build stage: compile the Angular application.
FROM docker.io/library/node:24.13.1-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: serve the compiled SPA with Nginx.
FROM docker.io/library/nginx:1.30.3-alpine3.23 AS runtime

RUN apk upgrade --no-cache

ENV NGINX_ENVSUBST_FILTER=DNS_RESOLVER

COPY docker/nginx/default.conf /etc/nginx/templates/default.conf.template
COPY docker/nginx/15-resolver.envsh /docker-entrypoint.d/15-resolver.envsh
RUN chmod +x /docker-entrypoint.d/15-resolver.envsh
COPY --from=build /app/dist/beer-project/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
