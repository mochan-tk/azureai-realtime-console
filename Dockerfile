# ───────────────────────── 1. ビルドステージ ─────────────────────────
FROM node:22 AS builder
WORKDIR /app

# 依存関係
COPY package*.json ./
RUN npm ci               # devDependencies 含めてインストール

# ソース
COPY . .

# client + server をまとめてビルド
RUN npm run build        # dist/client と dist/server が生成される

# ───────────────────────── 2. 実行ステージ ─────────────────────────
FROM node:22-slim
WORKDIR /usr/src/app

# 実行に必要なファイルだけコピー
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev    # 本番なので devDependencies 省く

# ビルド成果物とサーバーコードをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# 必要であれば .env などもコピー/設定
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","server.js"]