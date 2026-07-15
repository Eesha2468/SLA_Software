# STAGE 1: Frontend Build
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# STAGE 2: Backend Build
FROM node:18-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ .

# STAGE 3: Production Backend
FROM node:18-alpine AS backend
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
# Include dist in backend just in case of Node fallback
COPY --from=frontend-builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/index.js"]

# STAGE 4: Production Frontend (Nginx)
FROM nginx:alpine AS frontend
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
