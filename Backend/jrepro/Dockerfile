# Stage 1: Build the application using Maven and Eclipse Temurin Java 17
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Eclipse Temurin Java 17 JRE
FROM eclipse-temurin:17-jre-headless
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]