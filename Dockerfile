FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
COPY production.json /app/config/

ENV NODE_ENV=productionпше

ENV PORT=3030

EXPOSE $PORT

CMD [ "npm", "start" ]