FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom main nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy additional configuration files
COPY conf /etc/nginx/conf.d

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
