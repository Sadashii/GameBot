FROM node:16.14-alpine3.14

COPY package.json /package.json
RUN npm install

COPY . .

CMD ["node", "src/index.js"]