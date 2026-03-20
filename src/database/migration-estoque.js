const { connect } = require('./connection');

function migrate() {
    console.log('🔄 Adicionando campo de estoque aos produtos...');
    
    const db = connect();
    
    // Adicionar coluna estoque à tabela products
    db.run(`
        ALTER TABLE products ADD COLUMN estoque INTEGER DEFAULT 0
    `, function(err) {
        if (err) {
            // Se a coluna já existe, ignorar erro
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️ Coluna estoque já existe');
            } else {
                console.error('❌ Erro ao adicionar coluna estoque:', err);
            }
        } else {
            console.log('✅ Coluna estoque adicionada com sucesso!');
            
            // Atualizar produtos existentes com estoque padrão
            db.run(`
                UPDATE products SET estoque = 10 WHERE estoque IS NULL
            `, function(err) {
                if (err) {
                    console.error('❌ Erro ao atualizar estoque:', err);
                } else {
                    console.log('✅ Estoque padrão definido para produtos existentes');
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