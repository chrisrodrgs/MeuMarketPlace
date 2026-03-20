# 🚀 Marketplace - Versão 1.0

## ✨ Um marketplace completo com chat em tempo real, carrinho de compras, avaliações e painel administrativo!

---

## 📋 Índice
- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Como Executar](#como-executar)
- [Credenciais de Acesso](#credenciais-de-acesso)
- [Capturas de Tela](#capturas-de-tela)
- [Roadmap](#roadmap)

---

## 🎯 Sobre o Projeto

**Marketplace** é uma plataforma completa de comércio eletrônico desenvolvida com Node.js, Express e SQLite. O sistema permite que usuários vendam e comprem produtos, com funcionalidades modernas como chat em tempo real, sistema de avaliações, carrinho de compras e painel administrativo.

### 🌟 Destaques
- ✅ Interface moderna e responsiva
- ✅ Chat em tempo real (WebSockets)
- ✅ Sistema de avaliações com estrelas
- ✅ Carrinho de compras com validação de estoque
- ✅ Painel administrativo completo
- ✅ Upload de imagens (produtos e avatar)
- ✅ Busca avançada com filtros

---

## ⚡ Funcionalidades

### 👤 **Sistema de Usuários**
- [x] Cadastro e login com validação
- [x] Sessão persistente (7 dias)
- [x] Perfil com avatar personalizado
- [x] Upload e remoção de foto
- [x] Distinção entre usuário comum e administrador

### 📦 **Gerenciamento de Produtos**
- [x] Adicionar produto (nome, descrição, preço, categoria, estoque, status)
- [x] Upload de imagem com drag & drop
- [x] Editar produto com preview em tempo real
- [x] Listar produtos com estatísticas
- [x] Badge de status (Ativo/Inativo)
- [x] Deletar produto com confirmação

### 🛒 **Carrinho de Compras**
- [x] Adicionar/remover itens
- [x] Atualizar quantidade com validação de estoque
- [x] Verificação de disponibilidade
- [x] Badge com contador no header
- [x] Resumo do pedido
- [x] Aviso de itens indisponíveis

### ⭐ **Sistema de Avaliações**
- [x] Avaliar produtos (1 a 5 estrelas)
- [x] Comentários opcionais
- [x] Média geral e distribuição de notas
- [x] Editar e deletar avaliação própria
- [x] Exibição no produto

### 🔍 **Busca e Filtros**
- [x] Busca por nome/descrição
- [x] Filtros: categoria, faixa de preço, avaliação mínima
- [x] Ordenação: recentes, melhores avaliações, preço, nome
- [x] Visualização em grid ou lista
- [x] Paginação

### 💬 **Chat em Tempo Real**
- [x] Widget flutuante no canto inferior direito
- [x] Mensagens instantâneas (Socket.IO)
- [x] Indicador de digitação
- [x] Histórico de mensagens
- [x] Badge de mensagens não lidas
- [x] Admin visualiza todos os usuários

### 👑 **Painel Administrativo**
- [x] Dashboard com estatísticas
- [x] Gerenciar usuários (promover/remover admin, deletar)
- [x] Gerenciar produtos (listar, ver detalhes, deletar)
- [x] Gerenciar avaliações (deletar)
- [x] Visualização detalhada de usuários e produtos

---

___________________________________________________________________________________________

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 24.x | Runtime JavaScript |
| Express | 4.18.2 | Framework web |
| SQLite | 5.1.6 | Banco de dados |
| Socket.IO | 4.7.2 | Comunicação em tempo real |
| bcryptjs | 2.4.3 | Criptografia de senhas |
| multer | 1.4.5 | Upload de arquivos |
| express-session | 1.17.3 | Gerenciamento de sessões |
| connect-flash | 0.1.1 | Mensagens flash |

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Bootstrap | 5.3.0 | Framework CSS |
| EJS | 3.1.9 | Template engine |
| AOS | 2.3.1 | Animações scroll |
| Bootstrap Icons | 1.11.3 | Ícones |
| Socket.IO Client | 4.7.2 | Cliente WebSocket |

---

## 📊 Estrutura do Banco de Dados

```sql
-- Tabela de usuários
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    avatar TEXT,
    isAdmin INTEGER DEFAULT 0,
    data_criacao DATETIME
);

-- Tabela de produtos
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    price REAL,
    categoria TEXT,
    imagem TEXT,
    usuario_id INTEGER,
    estoque INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ativo',
    data_criacao DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de avaliações
CREATE TABLE avaliacoes (
    id INTEGER PRIMARY KEY,
    produto_id INTEGER,
    usuario_id INTEGER,
    nota INTEGER,
    comentario TEXT,
    data_avaliacao DATETIME,
    FOREIGN KEY (produto_id) REFERENCES products(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de carrinhos
CREATE TABLE carrinhos (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER,
    data_criacao DATETIME,
    data_atualizacao DATETIME,
    status TEXT DEFAULT 'ativo'
);

-- Tabela de itens do carrinho
CREATE TABLE carrinho_itens (
    id INTEGER PRIMARY KEY,
    carrinho_id INTEGER,
    produto_id INTEGER,
    quantidade INTEGER,
    preco_unitario REAL,
    data_adicao DATETIME
);

-- Tabela de mensagens do chat
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    sender_id INTEGER,
    sender_email TEXT,
    sender_name TEXT,
    sender_avatar TEXT,
    message TEXT,
    is_admin INTEGER,
    created_at DATETIME,
    read INTEGER,
    conversation_id TEXT
);
```
___________________________________________________________________________________________
**🚀 Como Executar**

Pré-requisitos: 
- Node.js 24.x ou superior
- npm ou yarn

Passo a passo
```
# 1. Clone o repositório
git clone https://github.com/christian-rodrigs/marketplace.git
cd marketplace

# 2. Instale as dependências
npm install

# 3. Crie o arquivo .env
echo "DB_PATH=./database/database.db" > .env

# 4. Execute as migrações do banco
node src/database/migration-carrinho.js
node src/database/migration-avaliacoes.js
node src/database/migration-estoque.js
node src/database/migration-add-status.js

# 5. Inicie o servidor
npm start
```

Acesse a aplicação
http://127.0.0.1:3000

___________________________________________________________________________________________
📁 **Estrutura do Projeto**
```
marketplace/
├── database/              # Banco de dados SQLite
├── public/
│   ├── css/               # Arquivos CSS
│   └── uploads/           # Imagens dos produtos e avatares
├── src/
│   ├── config/            # Configurações (multer, passport)
│   ├── controllers/       # Controladores da aplicação
│   ├── database/          # Conexão e migrações do banco
│   ├── middlewares/       # Middlewares personalizados
│   ├── models/            # Modelos do banco de dados
│   ├── socket/            # Configuração do Socket.IO
│   └── views/             # Templates EJS
│       ├── admin/         # Páginas administrativas
│       ├── chat/          # Páginas do chat
│       ├── includes/      # Partials (header, footer, etc)
│       └── search/        # Páginas de busca
├── .env                   # Variáveis de ambiente
├── routes.js              # Rotas da aplicação
├── server.js              # Ponto de entrada
└── package.json           # Dependências
```

📝 **Licença**
Este projeto está sob a licença MIT.

👨‍💻 **Autor**
Christian Rodrigues

**GitHub: [@christianrodrgs](https://github.com/chrisrodrgs)**

🌟 **Agradecimentos**

- Bootstrap Team - Framework CSS
- [Socket.IO](https://socket.io/) Team - Comunicação em tempo real
- SQLite Team - Banco de dados leve e rápido
- Professor [Diego Rodrigues](https://github.com/srdiegorodrigues)


<p align="center"> Feito com ❤️ por Christian Rodrigues </p> ```
