FROM node:lts-alpine

WORKDIR /app

# Add package.json and yarn.lock for frontend
RUN mkdir ./packages && mkdir ./packages/frontend
COPY ./packages/frontend/package.json ./packages/frontend
COPY ./packages/frontend/yarn.lock ./packages/frontend

# Copy oare package and build TS files
COPY ./packages/oare/ ./packages/oare
RUN cd ./packages/oare && yarn install && yarn build && cd ../..

# Copy over monorepo package.json and yarn.lock
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./lerna.json ./

# install project dependencies
RUN yarn install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

CMD [ "yarn", "serve" ]