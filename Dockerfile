FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini

# Copy everything first (including tsconfig.json/jsconfig.json)
COPY . .

# Install all dependencies for build
RUN npm ci

# Build Next.js
ENV NODE_ENV=production
RUN npm run build

# Remove devDependencies if you want smaller image
RUN npm prune --production

ENV PORT=3000
EXPOSE 3017

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start"]



# docker build -t monopoly-banker-app .
# docker run -d -p 3017:3000 --restart unless-stopped --name monopoly-banker-app monopoly-banker-app
