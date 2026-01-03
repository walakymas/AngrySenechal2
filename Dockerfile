# Use a Node base image
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy remaining files
COPY . .

# Expose port for Angular app
EXPOSE 4200

# Start the Angular dev server
CMD ["npm", "run", "serve"]