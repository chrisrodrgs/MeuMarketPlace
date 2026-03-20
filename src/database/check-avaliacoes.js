const { connect } = require('./connection');

function check() {
    const db = connect();
    
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Erro:', err);
        } else {
            console.log('📊 Tabelas no banco:');
            tables.forEach(t => console.log(`   - ${t.name}`));
        }
        db.close();
    });
}

check();