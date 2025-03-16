FROM node:22-alpine AS builder
WORKDIR /app
COPY steamed-notes-frontend/package*.json ./
RUN npm install
COPY steamed-notes-frontend/ .
RUN npm run build

# Stage 2: Copy artifacts to a deploy image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html 