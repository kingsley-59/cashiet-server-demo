FROM node:16
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm install -g nodemon
EXPOSE 5000
CMD ["nodemon", "server.js"]