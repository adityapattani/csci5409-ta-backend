FROM node:14

# Set working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code to container
COPY . .

# Expose port your app runs on
EXPOSE 5050

# Command to run the application
CMD ["node", "index.js"]