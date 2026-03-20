const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Criando tabelas do carrinho...');
    
    const db = connect();
    
    // Tabela de carrinhos
    db.run(`
        CREATE TABLE IF NOT EXISTS carrinhos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'abandonado', 'convertido')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela carrinhos:', err);
        } else {
            console.log('✅ Tabela carrinhos criada!');
        }
    });

    // Tabela de itens do carrinho
    db.run(`
        CREATE TABLE IF NOT EXISTS carrinho_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carrinho_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1 CHECK(quantidade > 0),
            preco_unitario REAL NOT NULL,
            data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(carrinho_id, produto_id)
        )
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela carrinho_itens:', err);
        } else {
            console.log('✅ Tabela carrinho_itens criada!');
        }
    });

    // Índices para melhor performance
    setTimeout(() => {
        db.run(`CREATE INDEX IF NOT EXISTS idx_carrinhos_usuario ON carrinhos(usuario_id, status)`, (err) => {
            if (err) console.error('❌ Erro ao criar índice:', err);
            else console.log('✅ Índices criados!');
        });
    }, 1000);

    setTimeout(() => {
        db.close();
        console.log('✅ Migração concluída!');
    }, 2000);
}

migrate();