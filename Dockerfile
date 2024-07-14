FROM node:20-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 5000

CMD ["node", "app.js"]