FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g nodemon
EXPOSE 5000
CMD ["nodemon", "server.js"]