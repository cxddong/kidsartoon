# 使用完整的 Node 镜像（非 alpine）
FROM node:20

# 安装 Python 和构建工具（canvas 需要）
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 复制项目文件
COPY . .

# 设置端口
ENV PORT=8080
EXPOSE 8080

# 启动命令
CMD ["node", "server.js"]