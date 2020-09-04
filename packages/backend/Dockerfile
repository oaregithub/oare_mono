FROM node:14.9.0
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .

CMD ["yarn", "dev"]