# Etapa de build
FROM oven/bun AS build

WORKDIR /app

# Instalar OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copiar arquivos de dependências
COPY package.json package.json
COPY bun.lock bun.lock

# Instalar dependências
RUN bun install

# Copiar código-fonte
COPY ./src ./src
COPY ./prisma ./prisma

# Configurar ambiente
ENV NODE_ENV=production

# Gerar cliente Prisma e compilar a aplicação
RUN bun prisma generate && bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile index \
  ./src/index.ts

# Etapa final
FROM oven/bun

WORKDIR /app

# Instalar OpenSSL na imagem final
RUN apt-get update -y && apt-get install -y openssl

# Copiar o binário compilado da etapa de build
COPY --from=build /app/index index
COPY ./prisma ./prisma

# Instalar apenas o Prisma CLI para migrações
RUN bun add prisma

# Executar migrações e iniciar a aplicação
CMD ["sh", "-c", "bun prisma migrate deploy && ./index"]

ENV NODE_ENV=production
