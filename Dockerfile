FROM node:18-alpine AS base
WORKDIR /usr/src/app


COPY package*.json ./

RUN npm ci


FROM base AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /usr/src/app

COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json .

EXPOSE 3000

CMD [ "node", "dist/server.js" ]