# ==========================================
# Stage 1: Build Frontend (Student Portal)
# ==========================================
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Admin Portal
# ==========================================
FROM node:18-alpine as admin-build
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm install
COPY admin/ ./
# Base path is already set in vite.config.ts
RUN npm run build

# ==========================================
# Stage 3: Final Image (Python + Nginx)
# ==========================================
FROM python:3.10-slim

# Install Nginx and Supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Setup Backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/app ./app


# Copy Built Frontends
# Create directories
RUN mkdir -p /var/www/student /var/www/admin

# Copy artifacts from build stages
COPY --from=frontend-build /app/frontend/dist /var/www/student
COPY --from=admin-build /app/admin/dist /var/www/admin

# Configuration Files
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment Variables
ENV PORT=8000

# Expose Port (Render sets $PORT dynamically, but typically we expose 80 for Nginx)
EXPOSE 80

# Run Supervisor
CMD ["/usr/bin/supervisord"]
