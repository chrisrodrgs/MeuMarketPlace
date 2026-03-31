const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho correto para o banco de dados (baseado na sua estrutura)
const dbPath = path.join(__dirname, '..', 'database', 'database.db');
console.log('📁 Caminho do banco de dados:', dbPath);

// Lista de banners para adicionar
const banners = [
    {
        titulo: 'Promoção de Verão',
        descricao: 'Até 50% de desconto em toda a loja!',
        imagem: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
        link: '/promocoes/verao',
        ordem: 1,
        ativo: 1
    },
    {
        titulo: 'Novos Produtos',
        descricao: 'Confira as novidades que chegaram',
        imagem: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
        link: '/produtos/novidades',
        ordem: 2,
        ativo: 1
    },
    {
        titulo: 'Frete Grátis',
        descricao: 'Compras acima de R$ 100,00',
        imagem: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&h=400&fit=crop',
        link: '/promocoes/frete-gratis',
        ordem: 3,
        ativo: 1
    },
    {
        titulo: 'Black Friday',
        descricao: 'Prepare-se para as maiores ofertas',
        imagem: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop',
        link: '/promocoes/black-friday',
        ordem: 4,
        ativo: 1
    },
    {
        titulo: 'Liquidação',
        descricao: 'Aproveite os preços especiais',
        imagem: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
        link: '/promocoes/liquidacao',
        ordem: 5,
        ativo: 1
    },
    {
        titulo: 'Lançamentos',
        descricao: 'Os produtos mais esperados do ano',
        imagem: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop',
        link: '/produtos/lancamentos',
        ordem: 6,
        ativo: 1
    },
    {
        titulo: 'Ofertas Relâmpago',
        descricao: 'Por tempo limitado',
        imagem: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
        link: '/promocoes/ofertas-relampago',
        ordem: 7,
        ativo: 1
    },
    {
        titulo: 'Moda Feminina',
        descricao: 'Coleção exclusiva',
        imagem: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop',
        link: '/categorias/feminino',
        ordem: 8,
        ativo: 1
    },
    {
        titulo: 'Moda Masculina',
        descricao: 'Estilo e elegância',
        imagem: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
        link: '/categorias/masculino',
        ordem: 9,
        ativo: 1
    },
    {
        titulo: 'Acessórios',
        descricao: 'Complete seu visual',
        imagem: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=1200&h=400&fit=crop',
        link: '/categorias/acessorios',
        ordem: 10,
        ativo: 1
    }
];

// Função para adicionar banners
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        console.log('\n⚠️  Verifique se:');
        console.log('1. O arquivo database.db existe em:', dbPath);
        console.log('2. Você está executando o script na pasta raiz do projeto');
        console.log('3. O diretório "database" existe');
        process.exit(1);
    }
    
    console.log('✅ Conectado ao banco com sucesso!\n');
    
    // Verificar se a tabela banners existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'", (err, row) => {
        if (err) {
            console.error('❌ Erro ao verificar tabela:', err.message);
            db.close();
            return;
        }
        
        if (!row) {
            console.error('❌ Tabela "banners" não encontrada!');
            console.log('⚠️  A tabela banners precisa ser criada primeiro.');
            console.log('   Ela deve existir no seu banco de dados.');
            db.close();
            return;
        }
        
        console.log('✅ Tabela "banners" encontrada!\n');
        
        // Verificar banners existentes
        db.get("SELECT COUNT(*) as total FROM banners", (err, result) => {
            if (err) {
                console.error('❌ Erro ao contar banners:', err.message);
                db.close();
                return;
            }
            
            console.log(`📊 Banners existentes: ${result.total}\n`);
            
            if (result.total > 0) {
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                readline.question('Deseja limpar os banners existentes antes de adicionar? (s/N): ', (resposta) => {
                    readline.close();
                    
                    if (resposta.toLowerCase() === 's') {
                        db.run("DELETE FROM banners", (err) => {
                            if (err) {
                                console.error('❌ Erro ao limpar banners:', err.message);
                                db.close();
                                return;
                            }
                            console.log('🗑️  Banners existentes removidos!\n');
                            inserirBanners();
                        });
                    } else {
                        inserirBanners();
                    }
                });
            } else {
                inserirBanners();
            }
        });
    });
});

function inserirBanners() {
    let inseridos = 0;
    let total = banners.length;
    
    banners.forEach((banner, index) => {
        db.run(`
            INSERT INTO banners (titulo, descricao, imagem, link, ordem, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [banner.titulo, banner.descricao, banner.imagem, banner.link, banner.ordem, banner.ativo],
        function(err) {
            if (err) {
                console.error(`❌ Erro ao adicionar "${banner.titulo}":`, err.message);
            } else {
                console.log(`✅ [ID: ${this.lastID}] ${banner.titulo}`);
                inseridos++;
            }
            
            // Quando todos forem processados
            if (index === total - 1) {
                console.log(`\n✨ ${inseridos} banners adicionados com sucesso!`);
                
                // Listar banners adicionados
                db.all("SELECT id, titulo, ordem, ativo FROM banners ORDER BY ordem", [], (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        console.log('\n📋 Lista de banners:');
                        console.log('='.repeat(60));
                        rows.forEach(b => {
                            console.log(`ID: ${b.id} | ${b.titulo} | Ordem: ${b.ordem} | Ativo: ${b.ativo ? 'Sim' : 'Não'}`);
                        });
                        console.log('='.repeat(60));
                    }
                    db.close();
                    console.log('\n🔌 Conexão encerrada.');
                });
            }
        });
    });
}