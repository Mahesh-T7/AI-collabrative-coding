# Base image
FROM node:18-slim

# Install system dependencies (compilers/interpreters)
# We use apt-get to install Python, GCC/G++, and Java (OpenJDK)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create temp directories for execution
RUN mkdir -p temp_execution && chmod 777 temp_execution

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
