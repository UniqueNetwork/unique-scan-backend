FROM node:18-alpine
RUN mkdir /app
WORKDIR /app
COPY . /app/
RUN npm install
RUN npm run build

CMD ["node", "-r", "source-map-support/register", "dist/apps/web-api/main.js"]
