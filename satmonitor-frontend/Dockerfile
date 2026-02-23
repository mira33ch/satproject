# ========= BUILD STAGE =========
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ========= RUNTIME STAGE =========
FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Adjust if dist folder has project name inside
COPY --from=build /app/dist/ ./

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
