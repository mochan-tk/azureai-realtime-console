FROM node:22
WORKDIR /usr/src/app
COPY package.json package*.json ./
RUN npm install
COPY . .

# ENV NODE_ENV=production

# Reactアプリのビルド（本番用静的ファイル生成）
# RUN npm run build:client
# RUN npm run build:server

EXPOSE 3000
CMD [ "npm", "start" ]