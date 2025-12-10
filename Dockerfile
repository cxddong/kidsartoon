# 使用 Node.js 官方镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install client dependencies
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install

# Return to root directory
WORKDIR /app

# 拷贝项目文件并构建前端
COPY . .
RUN npm run build

# 设置环境变量和端口
ENV PORT=8080
EXPOSE 8080

# 启动 Express 服务 (Use npm start to run compiled dist/index.js)
CMD ["npm", "start"]