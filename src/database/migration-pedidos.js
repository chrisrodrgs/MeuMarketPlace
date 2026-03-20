const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Criando tabelas para sistema de pedidos e analytics...');
    
    const db = connect();
    
    // Tabela de pedidos
    db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pendente',
            total REAL NOT NULL,
            endereco_entrega TEXT,
            forma_pagamento TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela pedidos:', err);
        } else {
            console.log('✅ Tabela pedidos criada!');
        }
    });

    // Tabela de itens do pedido
    db.run(`
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `, function(err) {
        if (err) {
            console.error('❌ Erro ao criar tabela pedido_itens:', err);
        } else {
            console.log('✅ Tabela pedido_itens criada!');
        }
    });

    // Índices para melhor performance
    setTimeout(() => {
        db.run(`CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido)`, (err) => {
            if (err) console.error('❌ Erro ao criar índice:', err);
            else console.log('✅ Índice idx_pedidos_data criado!');
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status)`, (err) => {
            if (err) console.error('❌ Erro ao criar índice:', err);
            else console.log('✅ Índice idx_pedidos_status criado!');
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id)`, (err) => {
            if (err) console.error('❌ Erro ao criar índice:', err);
            else console.log('✅ Índice idx_pedidos_usuario criado!');
        });
    }, 1000);

    setTimeout(() => {
        db.close();
        console.log('✅ Migração concluída!');
    }, 2000);
}

migrate();