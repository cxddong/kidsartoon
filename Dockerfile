FROM node:20

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]