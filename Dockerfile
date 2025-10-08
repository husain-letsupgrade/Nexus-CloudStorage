FROM node:18.12.1-alpine
WORKDIR /app
ADD package*.json ./
ADD . /app
RUN npm install
EXPOSE 3001
CMD [ "node", "src/server.js"]