const { connect } = require('./connection');

async function migrate() {
    const db = connect();
    
    try {
        // Verificar se a coluna já existe
        db.all("PRAGMA table_info(usuarios)", (err, rows) => {
            if (err) {
                console.error('Erro ao verificar tabela:', err);
                return;
            }
            
            const colunaExiste = rows.some(row => row.name === 'avatar');
            
            if (!colunaExiste) {
                // Adicionar coluna avatar à tabela usuarios
                db.run(`ALTER TABLE usuarios ADD COLUMN avatar TEXT`, (err) => {
                    if (err) {
                        console.error('Erro ao adicionar coluna:', err);
                    } else {
                        console.log('✅ Coluna "avatar" adicionada com sucesso!');
                    }
                });
            } else {
                console.log('ℹ️ Coluna "avatar" já existe.');
            }
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

migrate();