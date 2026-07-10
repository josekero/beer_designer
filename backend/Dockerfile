FROM docker.io/library/maven:3.9.12-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

FROM docker.io/library/eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/beer-designer-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
