# ========= BUILD STAGE =========
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom first (better caching)
COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline

# Copy source
COPY src ./src

# Build jar
RUN mvn -B -DskipTests package

# ========= RUNTIME STAGE =========
FROM eclipse-temurin:21-jre

WORKDIR /app

# Security: non-root user
RUN useradd -m appuser
USER appuser

# Copy built jar
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
