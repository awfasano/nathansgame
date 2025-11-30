FROM node:20-slim AS build
WORKDIR /app

# Install dependencies and build the production assets
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

# Lightweight static file server
RUN npm install -g serve

ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/dist ./dist

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
