# ============================================================
# Frontend Dockerfile
# Base image: nginx:alpine (lightweight web server)
# What it does: serves the HTML page and proxies /api/* to api-svc
# ============================================================

# Stage 1: use nginx:alpine as the base
FROM nginx:alpine

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY src/nginx.conf /etc/nginx/conf.d/default.conf

# Copy our HTML files into the nginx web root
COPY src/index.html /usr/share/nginx/html/index.html

# nginx:alpine runs as root by default
# We switch to user 101 (nginx) for security
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER 101

# Expose port 8080 (non-root port)
EXPOSE 8080

# nginx starts automatically as the container entrypoint
CMD ["nginx", "-g", "daemon off;"]
