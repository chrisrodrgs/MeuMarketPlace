require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '..', '..', 'database', 'database.db');

console.log('📁 Caminho do banco de dados:', dbPath);

let db;
let isCreatingAdmin = false;

function connect() {
    if (db) return db;

    db = new sqlite3.Database(dbPath);

    // ===== CRIAÇÃO DAS TABELAS =====
    
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
            promocao INTEGER DEFAULT 0,
            preco_promocional REAL,
            data_fim_promocao DATETIME,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS avaliacoes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            nota INTEGER CHECK (nota >= 1 AND nota <= 5),
            comentario TEXT,
            data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE(produto_id, usuario_id)
        )
    `);

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

    db.run(`
        CREATE TABLE IF NOT EXISTS cupons(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('percentual', 'fixo')),
            valor REAL NOT NULL,
            validade DATETIME,
            uso_maximo INTEGER DEFAULT 1,
            usos INTEGER DEFAULT 0,
            ativo INTEGER DEFAULT 1,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cupon_uso(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cupon_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            pedido_id INTEGER,
            data_uso DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cupon_id) REFERENCES cupons(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS banners(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT,
            imagem TEXT NOT NULL,
            link TEXT,
            ordem INTEGER DEFAULT 0,
            ativo INTEGER DEFAULT 1,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

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

// Criar admin após a conexão ser estabelecida (sem setTimeout)
function criarAdminSeNecessario() {
    const database = connect();
    if (isCreatingAdmin) return;
    isCreatingAdmin = true;
    
    database.get("SELECT * FROM usuarios WHERE email = 'admin@admin.com'", (err, row) => {
        if (err) {
            console.error('Erro ao verificar admin:', err);
            return;
        }
        
        if (!row) {
            const salt = bcrypt.genSaltSync(12);
            const hash = bcrypt.hashSync('admin123', salt);
            
            database.run(
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
        }
    });
}

// Executar criação do admin após um pequeno delay para garantir que as tabelas foram criadas
setTimeout(criarAdminSeNecessario, 500);

module.exports = { connect, run, get, all };