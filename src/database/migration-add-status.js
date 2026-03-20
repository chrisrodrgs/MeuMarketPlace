const { connect } = require('./connection');

function migrate() {
    const db = connect();
    
    db.run(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'ativo'`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️ Coluna status já existe');
            } else {
                console.error('❌ Erro:', err);
            }
        } else {
            console.log('✅ Coluna status adicionada');
        }
        db.close();
    });
}

migrate();