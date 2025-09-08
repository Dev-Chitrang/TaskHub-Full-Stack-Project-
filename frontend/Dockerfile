FROM node:20-bullseye

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy only package.json & package-lock.json
COPY package*.json ./

# Install dependencies inside container
RUN npm ci --verbose

# Copy the rest of the source code
COPY . .

# Clean previous builds just in case
RUN rm -rf .next

EXPOSE 3000

CMD ["npm", "run", "dev"]
