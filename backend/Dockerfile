FROM docker.io/library/maven:3.9.12-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -B package -DskipTests

FROM docker.io/library/eclipse-temurin:21-jre-alpine-3.23

WORKDIR /app
RUN apk upgrade --no-cache \
    && apk add --no-cache curl

COPY --from=build /app/target/beer-designer-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
