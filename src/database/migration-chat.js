const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar diretamente ao banco
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Conectado ao banco de dados...');

// Criar tabela
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        sender_email TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_avatar TEXT,
        message TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read INTEGER DEFAULT 0,
        conversation_id TEXT NOT NULL
    )
`, function(err) {
    if (err) {
        console.error('❌ Erro ao criar tabela:', err);
    } else {
        console.log('✅ Tabela messages criada/verificada');
    }
});

// Criar índices
db.run(`CREATE INDEX IF NOT EXISTS idx_conversation ON messages(conversation_id)`, (err) => {
    if (err) {
        console.error('❌ Erro ao criar índice conversation:', err);
    } else {
        console.log('✅ Índice conversation criado');
    }
});

db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at)`, (err) => {
    if (err) {
        console.error('❌ Erro ao criar índice created_at:', err);
    } else {
        console.log('✅ Índice created_at criado');
    }
});

// Fechar conexão
setTimeout(() => {
    db.close();
    console.log('✅ Migração concluída!');
}, 1000);