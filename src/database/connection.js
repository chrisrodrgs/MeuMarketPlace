require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '..', '..', 'database', 'database.db');

console.log('📁 Caminho do banco de dados:', dbPath);

let db;

function connect() {
    if (db) return db;

    db = new sqlite3.Database(dbPath);

    // ===== CRIAÇÃO DAS TABELAS (PRIMEIRO) =====
    
    // Tabela USUÁRIOS
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            isAdmin INTEGER DEFAULT 0,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabela PRODUTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS products(
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
        )
    `);

    // Tabela AVALIAÇÕES
    db.run(`
        CREATE TABLE IF NOT EXISTS avaliacoes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
            comentario TEXT,
            data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE(produto_id, usuario_id)
        )
    `);

    // Tabela CARRINHOS
    db.run(`
        CREATE TABLE IF NOT EXISTS carrinhos(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'ativo',
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    // Tabela ITENS DO CARRINHO
    db.run(`
        CREATE TABLE IF NOT EXISTS carrinho_itens(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carrinho_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1,
            preco_unitario REAL NOT NULL,
            data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(carrinho_id, produto_id)
        )
    `);

    // Tabela MENSAGENS DO CHAT
    db.run(`
        CREATE TABLE IF NOT EXISTS messages(
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
        )
    `);

    // Tabela PEDIDOS
    db.run(`
        CREATE TABLE IF NOT EXISTS pedidos(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pendente',
            total REAL NOT NULL,
            endereco_entrega TEXT,
            forma_pagamento TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    // Tabela ITENS DO PEDIDO
    db.run(`
        CREATE TABLE IF NOT EXISTS pedido_itens(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    // ===== DEPOIS DE CRIAR AS TABELAS, CRIAR O ADMIN =====
    // Usar setTimeout para garantir que as tabelas foram criadas
    setTimeout(() => {
        db.get("SELECT * FROM usuarios WHERE email = 'admin@admin.com'", (err, row) => {
            if (err) {
                console.error('Erro ao verificar admin:', err);
                return;
            }
            
            if (!row) {
                const salt = bcrypt.genSaltSync(12);
                const hash = bcrypt.hashSync('admin123', salt);
                
                db.run(
                    "INSERT INTO usuarios (email, password, isAdmin) VALUES (?, ?, ?)",
                    ['admin@admin.com', hash, 1],
                    function(err) {
                        if (err) {
                            console.error('Erro ao criar admin:', err);
                        } else {
                            console.log('✅ Usuário admin criado: admin@admin.com / admin123');
                        }
                    }
                );
            } else {
                console.log('✅ Usuário admin já existe');
            }
        });
    }, 500);

    return db;
}

function run(sql, params = []) {
    const database = connect();
    return new Promise((resolve, reject) => {
        database.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    const database = connect();
    return new Promise((resolve, reject) => {
        database.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function all(sql, params = []) {
    const database = connect();
    return new Promise((resolve, reject) => {
        database.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = { connect, run, get, all };