# 🚀 Marketplace - Versão 3.0

## ✨ Um marketplace completo com chat em tempo real, carrinho de compras, avaliações, central de análise de dados e painel administrativo!

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

**Marketplace** é uma plataforma completa de comércio eletrônico desenvolvida com Node.js, Express e SQLite. O sistema permite que usuários vendam e comprem produtos, com funcionalidades modernas como chat em tempo real, sistema de avaliações, carrinho de compras, central de análise de dados e painel administrativo.

### 🌟 Destaques
- ✅ Interface moderna e responsiva com CSS global
- ✅ Chat em tempo real (WebSockets) com widget flutuante
- ✅ Sistema de avaliações com estrelas e distribuição de notas
- ✅ Carrinho de compras com validação de estoque
- ✅ Painel administrativo completo
- ✅ Central de Análise de Dados com gráficos e métricas
- ✅ Upload de imagens (produtos e avatar)
- ✅ Busca avançada com múltiplos filtros
- ✅ Sistema de pedidos e histórico de compras

---

## ⚡ Funcionalidades

### 👤 **Sistema de Usuários**
- [x] Cadastro e login com validação
- [x] Sessão persistente (7 dias)
- [x] Perfil personalizado com avatar
- [x] Upload e remoção de foto de perfil
- [x] Distinção entre usuário comum e administrador

### 📦 **Gerenciamento de Produtos**
- [x] Adicionar produto (nome, descrição, preço, categoria, estoque, status)
- [x] Upload de imagem com drag & drop e preview
- [x] Editar produto com preview em tempo real e comparação de valores
- [x] Listar produtos com estatísticas e badges de status
- [x] Badge de status (Ativo/Inativo)
- [x] Deletar produto com confirmação

### 🛒 **Carrinho de Compras**
- [x] Adicionar e remover itens
- [x] Atualizar quantidade com validação de estoque
- [x] Verificação automática de disponibilidade (estoque + status ativo)
- [x] Badge com contador no cabeçalho
- [x] Resumo do pedido com subtotal e total
- [x] Avisos claros para itens indisponíveis

### ⭐ **Sistema de Avaliações**
- [x] Avaliação com estrelas (1 a 5)
- [x] Comentários opcionais
- [x] Média geral e distribuição de notas com gráficos
- [x] Editar e deletar avaliação própria
- [x] Exibição integrada na página do produto

### 🔍 **Busca e Filtros**
- [x] Busca por nome ou descrição
- [x] Filtros: categoria, faixa de preço, avaliação mínima (1 a 5 estrelas)
- [x] Ordenação: mais recentes, melhores avaliações, mais avaliados, preço (crescente/decrescente), nome (A-Z/Z-A)
- [x] Visualização em grade ou lista
- [x] Paginação automática

### 💬 **Chat em Tempo Real**
- [x] Widget flutuante no canto inferior direito (sempre visível)
- [x] Mensagens instantâneas via WebSocket
- [x] Indicador de digitação
- [x] Histórico de mensagens persistido
- [x] Badge de mensagens não lidas
- [x] Admin visualiza todos os usuários e pode atender individualmente
- [x] Interface dedicada para atendimento no painel admin

### 📊 **Central de Análise de Dados**
- [x] Dashboard com estatísticas gerais
- [x] Gráficos de crescimento (usuários, produtos, avaliações)
- [x] Gráfico de vendas mensais
- [x] Top vendedores e produtos mais vendidos
- [x] Produtos melhor avaliados
- [x] Distribuição de avaliações
- [x] Exportação de relatórios (CSV/JSON)
- [x] API para dados em tempo real

### 👑 **Painel Administrativo**
- [x] Dashboard com estatísticas
- [x] Gerenciar usuários (promover/remover admin, deletar, ver detalhes)
- [x] Gerenciar produtos (listar, ver detalhes, deletar)
- [x] Gerenciar avaliações (deletar avaliações inadequadas)
- [x] Visualização detalhada de usuários e produtos
- [x] Chat administrativo para atendimento aos clientes
- [x] Central de Análise de Dados

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 24.x | Runtime JavaScript |
| Express | 4.18.2 | Framework web |
| SQLite | 5.1.6 | Banco de dados relacional |
| Socket.IO | 4.7.2 | Comunicação em tempo real |
| bcryptjs | 2.4.3 | Criptografia de senhas |
| multer | 1.4.5 | Upload de arquivos |
| express-session | 1.17.3 | Gerenciamento de sessões |
| connect-flash | 0.1.1 | Mensagens flash |
| validator | 13.11.0 | Validação de dados |

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Bootstrap | 5.3.0 | Framework CSS responsivo |
| EJS | 3.1.9 | Template engine |
| AOS | 2.3.1 | Animações de scroll |
| Bootstrap Icons | 1.11.3 | Biblioteca de ícones |
| Chart.js | 4.4.0 | Gráficos interativos |
| Socket.IO Client | 4.7.2 | Cliente WebSocket |

---

## 📊 Estrutura do Banco de Dados

### Diagrama de Tabelas

```sql
-- Usuários
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    isAdmin INTEGER DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Produtos
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    categoria TEXT,
    imagem TEXT,
    usuario_id INTEGER,
    estoque INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ativo',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Avaliações
CREATE TABLE avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(produto_id, usuario_id)
);

-- Carrinhos
CREATE TABLE carrinhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ativo',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Itens do Carrinho
CREATE TABLE carrinho_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carrinho_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario REAL NOT NULL,
    data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(carrinho_id, produto_id)
);

-- Mensagens do Chat
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    message TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0,
    conversation_id TEXT NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Pedidos
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pendente',
    total REAL NOT NULL,
    endereco_entrega TEXT,
    forma_pagamento TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Itens do Pedido
CREATE TABLE pedido_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE
);
```
___________________________________________________________________________________________
**🚀 Como Executar**

Pré-requisitos: 
- Node.js 24.x ou superior
- npm ou yarn

Passo a passo
```
## 1. Clone o repositório
git clone https://github.com/chrisrodrgs/MeuMarketPlace.git
cd MeuMarketPlace

# 2. Instale as dependências
npm install

# 3. Crie o arquivo .env (configuração do banco)
echo "DB_PATH=./database/database.db" > .env

# 4. Inicie o servidor (o banco de dados será criado automaticamente)
npm start

# 5. Inicie o servidor
npm start
```

*Acesse a aplicação*
http://127.0.0.1:3000

___________________________________________________________________________________________
📁 **Estrutura do Projeto**
```
MeuMarketPlace/
├── database/                   # Banco de dados SQLite
├── public/
│   ├── css/
│   │   └── global.css          # CSS centralizado
│   └── uploads/                # Imagens dos produtos e avatares
│       ├── produtos/           # Imagens dos produtos
│       └── avatars/            # Fotos de perfil
├── src/
│   ├── config/                 # Configurações
│   │   ├── multerConfig.js     # Configuração do upload de produtos
│   │   └── multerAvatarConfig.js
│   ├── controllers/            # Controladores da aplicação
│   │   ├── adminController.js
│   │   ├── adminChatController.js
│   │   ├── adminAnalyticsController.js
│   │   ├── avaliacaoController.js
│   │   ├── carrinhoController.js
│   │   ├── categoriaController.js
│   │   ├── homeController.js
│   │   ├── loginController.js
│   │   ├── perfilController.js
│   │   ├── produtoAdcController.js
│   │   ├── produtoController.js
│   │   ├── produtoDeleteController.js
│   │   ├── produtoListController.js
│   │   └── searchController.js
│   ├── database/               # Conexão com o banco
│   │   └── connection.js       # Conexão e criação de tabelas
│   ├── middlewares/            # Middlewares personalizados
│   │   └── middlewares.js
│   ├── models/                 # Modelos do banco
│   │   ├── ProdutosModel.js
│   │   └── UsuariosModel.js
│   ├── socket/                 # Configuração do Socket.IO
│   │   └── chatServer.js
│   └── views/                  # Templates EJS
│       ├── admin/              # Páginas administrativas
│       ├── chat/               # Páginas do chat
│       ├── includes/           # Partials (header, footer, chat widget)
│       ├── search/             # Páginas de busca
│       ├── adicionar-produto.ejs
│       ├── carrinho.ejs
│       ├── categoria.ejs
│       ├── categorias.ejs
│       ├── confirmar-delecao.ejs
│       ├── editarProduto.ejs
│       ├── em-breve.ejs
│       ├── index.ejs
│       ├── login.ejs
│       ├── meus-produtos.ejs
│       ├── perfilView.ejs
│       ├── produto.ejs
│       └── produtos-usuario.ejs
├── .env                        # Variáveis de ambiente (não commitar)
├── .gitignore                  # Arquivos ignorados pelo Git
├── package.json                # Dependências e scripts
├── routes.js                   # Rotas da aplicação
├── server.js                   # Ponto de entrada
└── README.md                   # Documentação
```

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor em modo produção |
| `npm run dev` | Inicia o servidor com nodemon (desenvolvimento com auto-reload) |

## 🗺️ Roadmap

### ✅ Versão 1.0 (Lançada)

<div>

| Funcionalidade | Status |
|----------------|:------:|
| Sistema de autenticação de usuários | ✅ |
| CRUD completo de produtos | ✅ |
| Carrinho de compras | ✅ |
| Sistema de avaliações com estrelas | ✅ |
| Chat em tempo real (Socket.IO) | ✅ |
| Painel administrativo | ✅ |
| Busca com filtros avançados | ✅ |
| Upload de imagens (drag & drop) | ✅ |
| Design responsivo | ✅ |

</div>

---

### ✅ Versão 2.0 (Atual)

<div>

| Funcionalidade | Status |
|----------------|:------:|
| Central de Análise de Dados com gráficos | ✅ |
| Exportação de relatórios (CSV/JSON) | ✅ |
| Chat administrativo dedicado | ✅ |
| CSS global centralizado | ✅ |
| Melhorias de UI/UX | ✅ |
| Otimizações de performance | ✅ |
| Validação de estoque em tempo real | ✅ |

</div>

---



## 📄 Licença

Distribuído sob a licença MIT.

---

## 👨‍💻 Autor

**Christian Rodrigues**

[![GitHub](https://img.shields.io/badge/GitHub-chrisrodrgs-181717?style=flat&logo=github)](https://github.com/chrisrodrgs)

---

## 🌟 Agradecimentos

| Tecnologia | Descrição |
|------------|-----------|
| [Bootstrap](https://getbootstrap.com/) | Framework CSS |
| [Socket.IO](https://socket.io/) | Comunicação em tempo real |
| [SQLite](https://www.sqlite.org/) | Banco de dados |
| [Express](https://expressjs.com/) | Framework web |
| [AOS](https://michalsnik.github.io/aos/) | Animações de scroll |
| [Chart.js](https://www.chartjs.org/) | Gráficos interativos |

**[Professor Diego Rodrigues](https://github.com/srdiegorodrigues/)** - Orientação e suporte

---

<p align="center">
  Feito com ❤️ por <strong>Christian Rodrigues</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-24.x-green" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>
