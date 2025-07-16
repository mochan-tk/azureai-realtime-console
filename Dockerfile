FROM node:22
WORKDIR /usr/src/app
COPY package.json package*.json ./
RUN npm install
COPY . .

# RUN npm run build

# ENV NODE_ENV=production
EXPOSE 3000
CMD [ "npm", "start" ]