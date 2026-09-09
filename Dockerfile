FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY dist ./dist
USER node
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/server.cjs"]
