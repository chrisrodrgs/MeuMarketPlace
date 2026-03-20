const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Criando tabela de avaliações...');
    
    const db = connect();
    
    // Primeiro criar a tabela
    db.run(`
        CREATE TABLE IF NOT EXISTS avaliacoes (
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
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela avaliacoes:', err);
        } else {
            console.log('✅ Tabela avaliacoes criada com sucesso!');
            
            // SÓ DEPOIS de criar a tabela, criar os índices
            db.run(`CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes(produto_id)`, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar índice:', err);
                } else {
                    console.log('✅ Índice idx_avaliacoes_produto criado!');
                }
            });

            db.run(`CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario ON avaliacoes(usuario_id)`, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar índice:', err);
                } else {
                    console.log('✅ Índice idx_avaliacoes_usuario criado!');
                }
            });
        }
    });

    setTimeout(() => {
        db.close();
        console.log('✅ Migração concluída!');
    }, 1500);
}

migrate();