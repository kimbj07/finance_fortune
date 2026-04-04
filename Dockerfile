# Vite 7 requires Node.js 20.19+ or 22.12+
FROM node:22-alpine

WORKDIR /app

# Install Vercel CLI globally
RUN npm install -g vercel@37

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose ports (Vite: 5173, Vercel Dev: 3000)
EXPOSE 5173 3000

# Start dev server
CMD ["npm", "run", "dev", "--", "--host"]
