FROM node:20-slim AS build
WORKDIR /app

# Install dependencies and build the production assets
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

CMD ["node", "server.js"]
