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

# Instalar OpenSSL e dependências para wait-for-it
RUN apt-get update -y && apt-get install -y openssl bash curl && curl -sL https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh >wait-for-it.sh && chmod +x wait-for-it.sh

# Copiar o binário compilado da etapa de build
COPY --from=build /app/index index
COPY ./prisma ./prisma

# Instalar apenas o Prisma CLI para migrações
RUN bun add prisma

# Executar migrações e iniciar a aplicação
CMD ["sh", "-c", "./wait-for-it.sh db:5432 --timeout 30 -- bun prisma migrate deploy && ./index"]

ENV NODE_ENV=production
