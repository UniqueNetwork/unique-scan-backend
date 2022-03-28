FROM node:16.14-alpine3.14
RUN mkdir /app
WORKDIR /app
COPY . /app/
RUN npm install
RUN npm run build

CMD ["node", "-r", "source-map-support/register", "dist/apps/web-api/main.js"]
