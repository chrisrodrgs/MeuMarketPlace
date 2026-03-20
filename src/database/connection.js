require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

//const dbPath = path.resolve(__dirname, '..', '..', 'database', 'database.db');
const dbPath = process.env.DB_PATH;

let db;

function connect(){
    if(db) return db;

    db = new sqlite3.Database(dbPath);

    // PRIMEIRO: Criar a tabela usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            isAdmin INTEGER DEFAULT 0,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, function(err) {
        if (err) {
            console.error('Erro ao criar tabela usuarios:', err);
        } else {
            console.log('✅ Tabela usuarios criada/verificada');
            
            // SÓ DEPOIS de criar a tabela, verificar/criar o admin
            db.get("SELECT * FROM usuarios WHERE email = 'admin@admin.com'", async (err, row) => {
                if (err) {
                    console.error('Erro ao verificar admin:', err);
                    return;
                }
                
                if (!row) {
                    try {
                        const salt = await bcrypt.genSalt(12);
                        const hash = await bcrypt.hash('admin123', salt);
                        
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
                    } catch (error) {
                        console.error('Erro ao criar hash do admin:', error);
                    }
                } else {
                    console.log('✅ Usuário admin já existe');
                }
            });
        }
    });

    // DEPOIS: Criar tabela products
    db.run(`
        CREATE TABLE IF NOT EXISTS products(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            categoria TEXT,
            imagem TEXT,
            usuario_id INTEGER,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `, function(err) {
        if (err) {
            console.error('Erro ao criar tabela products:', err);
        } else {
            console.log('✅ Tabela products criada/verificada');
        }
    });

    return db;
}

function run(sql, params = []){
    const database = connect();
    return new Promise((resolve, reject) => {
        database.run(sql, params, function(err){
            if(err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes});
        });
    });
}

function get(sql, params = []){
    const database = connect();
    return new Promise((resolve, reject) => {
        database.get(sql, params, (err, row) => {
            if(err) return reject(err);
            resolve(row);
        });
    });
}

function all(sql, params = []){
    const database = connect();
    return new Promise((resolve, reject) => {
        database.all(sql, params, (err, rows) => {
            if(err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {connect, run, get, all};