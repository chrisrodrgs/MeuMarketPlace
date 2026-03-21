const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Criando tabelas de promoções e cupons...');
    
    const db = connect();

    // Tabela de cupons de desconto
    db.run(`
        CREATE TABLE IF NOT EXISTS cupons (
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

    // Tabela de uso de cupons
    db.run(`
        CREATE TABLE IF NOT EXISTS cupon_uso (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cupon_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            pedido_id INTEGER,
            data_uso DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cupon_id) REFERENCES cupons(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    // Tabela de banners do carrossel
    db.run(`
        CREATE TABLE IF NOT EXISTS banners (
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

    // Adicionar coluna de promoção na tabela products
    db.run(`
        ALTER TABLE products ADD COLUMN promocao INTEGER DEFAULT 0
    `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna promocao:', err);
        } else if (!err) {
            console.log('✅ Coluna promocao adicionada');
        }
    });

    db.run(`
        ALTER TABLE products ADD COLUMN preco_promocional REAL
    `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna preco_promocional:', err);
        } else if (!err) {
            console.log('✅ Coluna preco_promocional adicionada');
        }
    });

    db.run(`
        ALTER TABLE products ADD COLUMN data_fim_promocao DATETIME
    `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna data_fim_promocao:', err);
        } else if (!err) {
            console.log('✅ Coluna data_fim_promocao adicionada');
        }
    });

    // Criar cupom de exemplo - CORRIGIDO
    db.get("SELECT * FROM cupons WHERE codigo = 'BEMVINDO10'", (err, row) => {
        if (!row) {
            db.run(
                "INSERT INTO cupons (codigo, tipo, valor, validade, uso_maximo) VALUES (?, ?, ?, datetime('now', '+30 days'), ?)",
                ['BEMVINDO10', 'percentual', 10, 100],
                function(err) {
                    if (err) {
                        console.error('Erro ao criar cupom exemplo:', err);
                    } else {
                        console.log('✅ Cupom de exemplo criado: BEMVINDO10 (10% de desconto)');
                    }
                }
            );
        }
    });

    // Criar banner de exemplo - CORRIGIDO
    db.get("SELECT * FROM banners LIMIT 1", (err, row) => {
        if (!row) {
            db.run(`
                INSERT INTO banners (titulo, descricao, imagem, link, ordem) 
                VALUES (?, ?, ?, ?, ?)
            `, ['Promoção Especial', 'Descontos incríveis em produtos selecionados', '/uploads/banners/promo1.jpg', '/busca', 1], 
            function(err) {
                if (err) {
                    console.error('Erro ao criar banner exemplo:', err);
                } else {
                    console.log('✅ Banner de exemplo criado');
                }
            });
        }
    });

    setTimeout(() => {
        db.close();
        console.log('✅ Migração concluída!');
    }, 2000);
}

migrate();