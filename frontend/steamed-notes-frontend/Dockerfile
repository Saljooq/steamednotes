FROM node:19-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
VOLUME /app/dist
CMD ["echo", "Build complete"]