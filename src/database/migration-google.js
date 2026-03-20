const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Criando tabela de credenciais federadas...');
    
    const db = connect();
    
    db.run(`
        CREATE TABLE IF NOT EXISTS federated_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            subject TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela:', err);
        } else {
            console.log('✅ Tabela federated_credentials criada!');
            
            // Criar índices
            db.run(`CREATE INDEX IF NOT EXISTS idx_federated_user ON federated_credentials(user_id)`, (err) => {
                if (err) console.error('❌ Erro ao criar índice:', err);
                else console.log('✅ Índice idx_federated_user criado!');
            });
            
            db.run(`CREATE INDEX IF NOT EXISTS idx_federated_provider ON federated_credentials(provider, subject)`, (err) => {
                if (err) console.error('❌ Erro ao criar índice:', err);
                else console.log('✅ Índice idx_federated_provider criado!');
            });
        }
    });

    setTimeout(() => {
        db.close();
        console.log('✅ Migração concluída!');
    }, 2000);
}

migrate();