# Use Node.js 18 as the base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the app code
COPY . .

# Expose the port and start the server
EXPOSE 8080
CMD ["node", "index.js"]
