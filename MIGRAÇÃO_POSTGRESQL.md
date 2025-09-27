# Migração para PostgreSQL

## Resumo das Alterações

Seu bot foi migrado com sucesso do SQLite para PostgreSQL. Aqui estão as principais mudanças feitas:

### 1. Dependências Atualizadas
- Removido `pg` (não necessário, Prisma gerencia a conexão)
- Removido `@types/pg` (não necessário)
- Mantido apenas `@prisma/client` e `prisma` (devDependency)

### 2. Schema Prisma
- Alterado provider de `sqlite` para `postgresql`
- Corrigido campo `autoRoleIDs` para usar array nativo do PostgreSQL (`String[]`) em vez de JSON string

### 3. Código Corrigido
- **AutoRole**: Corrigida manipulação de arrays no comando `/autorole`
- **Eventos**: Corrigido evento `guildMemberAdd` para funcionar com arrays nativos
- **Comandos de Voz**: Corrigidas verificações de nomes de canais e lógica de permissões
- **Lock**: Corrigida lógica de permissões para trancar/destrancar canais
- **Kick**: Corrigido uso de `permissionOverwrites.edit` em vez de `create`

## Configuração do PostgreSQL

### 1. Instalar PostgreSQL
```bash
# No Windows (usando Chocolatey)
choco install postgresql

# Ou baixar do site oficial: https://www.postgresql.org/download/
```

### 2. Criar Banco de Dados
```sql
-- Conectar ao PostgreSQL como superusuário
psql -U postgres

-- Criar banco de dados
CREATE DATABASE foxcord_db;

-- Criar usuário (opcional)
CREATE USER foxcord_user WITH ENCRYPTED PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE foxcord_db TO foxcord_user;
```

### 3. Configurar Variável de Ambiente
Crie um arquivo `.env` na raiz do projeto com:
```env
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/foxcord_db
```

### 4. Executar Migração
```bash
# Instalar dependências
bun install

# Gerar cliente Prisma
bun run db:generate

# Executar migrações (primeira vez)
bun run db:push

# Ou para desenvolvimento
bun run db:migrate

# Para produção
bun run db:deploy
```

### 5. Scripts Disponíveis
- `bun run dev` - Executar em desenvolvimento
- `bun run start` - Executar em produção
- `bun run build` - Gerar cliente Prisma (apenas)
- `bun run db:generate` - Gerar cliente Prisma
- `bun run db:push` - Sincronizar schema com banco (desenvolvimento)
- `bun run db:migrate` - Criar migração (desenvolvimento)
- `bun run db:deploy` - Executar migrações (produção)

### 6. Deploy no Railway
Para fazer deploy no Railway:

1. **Configure o banco PostgreSQL no Railway**
2. **Configure as variáveis de ambiente**:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DATABASE_URL` (fornecido pelo Railway)
3. **O build agora só gera o cliente Prisma** (sem tentar conectar no banco)
4. **Execute as migrações manualmente** após o deploy:
   ```bash
   bun run db:deploy
   ```
   Ou use o Railway CLI:
   ```bash
   railway run bun run db:deploy
   ```

## Funcionalidades Corrigidas

### ✅ Sistema de AutoRole
- Agora funciona corretamente com arrays nativos do PostgreSQL
- Comandos `/autorole add`, `/autorole remove`, `/autorole list` funcionando

### ✅ Sistema de Canais de Voz Temporários
- Criação automática de canais funcionando
- Comandos de gerenciamento (`/lock`, `/limite`, `/renomear`, `/kick`, `/transferir`) corrigidos
- Limpeza automática de canais vazios funcionando

### ✅ Eventos do Discord
- `guildMemberAdd` funcionando com AutoRole
- `voiceStateUpdate` funcionando com canais temporários

## Como Testar

1. Configure o PostgreSQL e as variáveis de ambiente
2. Execute `bun run dev` para testar em desenvolvimento
3. Teste os comandos:
   - `/setupvoice` para configurar canal gerador
   - `/autorole toggle` para ativar sistema de cargos automáticos
   - Entre em canal de voz para testar criação automática
   - Use comandos de voz (`/lock`, `/limite`, etc.)

## Problemas Conhecidos Corrigidos

1. **Arrays no SQLite**: Estava usando string JSON, agora usa array nativo do PostgreSQL
2. **Operações Push/Set**: Removidas operações específicas do Prisma que não funcionavam
3. **Verificação de Canais**: Corrigida verificação de prefixo "🚀" nos comandos de voz
4. **Permissões**: Corrigida lógica de permissões em comandos de lock, kick e transfer

Sua migração está completa! 🎉
