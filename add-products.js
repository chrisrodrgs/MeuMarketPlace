const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('📁 Conectando ao banco:', dbPath);

// Produtos normais (sem promoção)
const produtosNormais = [
    // Doces
    { nome: 'Brownie de Doce de Leite', descricao: 'Brownie recheado com doce de leite artesanal, cobertura de chocolate meio amargo.', preco: 12.50, categoria: 'Doces', estoque: 50, imagem: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Brownie de Nutella', descricao: 'Brownie com generosa camada de Nutella e avelãs crocantes.', preco: 14.00, categoria: 'Doces', estoque: 45, imagem: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Brownie Tradicional', descricao: 'Brownie clássico com pedaços de chocolate meio amargo.', preco: 10.00, categoria: 'Doces', estoque: 60, imagem: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Torta de Limão', descricao: 'Torta com base de biscoito, creme de limão e merengue.', preco: 25.00, categoria: 'Doces', estoque: 30, imagem: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Cheesecake de Frutas Vermelhas', descricao: 'Cheesecake cremoso com calda de frutas vermelhas.', preco: 28.00, categoria: 'Doces', estoque: 25, imagem: 'https://images.unsplash.com/photo-1524351199678-882a25434a9c?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Macarons Sortidos', descricao: 'Macarons franceses em diversos sabores (chocolate, pistache, framboesa).', preco: 32.00, categoria: 'Doces', estoque: 40, imagem: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=300&fit=crop', status: 'ativo' },
    
    // Salgados
    { nome: 'Coxinha de Frango', descricao: 'Coxinha de frango com catupiry, empanada e frita.', preco: 6.00, categoria: 'Salgados', estoque: 100, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Empada de Palmito', descricao: 'Empada de palmito com massa podre e recheio cremoso.', preco: 7.50, categoria: 'Salgados', estoque: 80, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Pastel de Carne', descricao: 'Pastel assado com recheio de carne moída e azeitonas.', preco: 5.00, categoria: 'Salgados', estoque: 120, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Quiche de Alho-poró', descricao: 'Quiche com alho-poró, queijo gruyère e massa amanteigada.', preco: 18.00, categoria: 'Salgados', estoque: 35, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Esfiha de Carne', descricao: 'Esfiha aberta com carne temperada, limão e hortelã.', preco: 5.50, categoria: 'Salgados', estoque: 90, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo' },
    
    // Café da manhã
    { nome: 'Pão de Queijo', descricao: 'Pão de queijo mineiro tradicional, assado na hora.', preco: 4.00, categoria: 'Café da manhã', estoque: 150, imagem: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Croissant Manteiga', descricao: 'Croissant francês folhado com manteiga de qualidade.', preco: 8.00, categoria: 'Café da manhã', estoque: 60, imagem: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Bolo de Cenoura', descricao: 'Bolo de cenoura com cobertura de chocolate.', preco: 12.00, categoria: 'Café da manhã', estoque: 40, imagem: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Misto Quente', descricao: 'Sanduíche de pão de forma com presunto, queijo e molho especial.', preco: 9.00, categoria: 'Café da manhã', estoque: 70, imagem: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', status: 'ativo' },
    
    // Bebidas
    { nome: 'Café Expresso', descricao: 'Café expresso encorpado com notas de chocolate.', preco: 5.00, categoria: 'Bebidas', estoque: 200, imagem: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Capuccino', descricao: 'Capuccino cremoso com canela em pó.', preco: 8.50, categoria: 'Bebidas', estoque: 150, imagem: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Suco Natural de Laranja', descricao: 'Suco de laranja natural, feito na hora.', preco: 7.00, categoria: 'Bebidas', estoque: 100, imagem: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Chá Gelado', descricao: 'Chá gelado de pêssego com hortelã.', preco: 6.00, categoria: 'Bebidas', estoque: 80, imagem: 'https://images.unsplash.com/photo-1544787219-7f47a3c3b1d6?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Smoothie de Morango', descricao: 'Smoothie cremoso de morango com banana e leite.', preco: 12.00, categoria: 'Bebidas', estoque: 60, imagem: 'https://images.unsplash.com/photo-1553530666-5b4b90e5e7a4?w=400&h=300&fit=crop', status: 'ativo' },
    
    // Descartáveis
    { nome: 'Copo 200ml', descricao: 'Copo descartável 200ml, pacote com 100 unidades.', preco: 15.00, categoria: 'Descartáveis', estoque: 500, imagem: 'https://images.unsplash.com/photo-1586359375245-8151433a5b31?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Prato de Papel', descricao: 'Prato de papel resistente, pacote com 50 unidades.', preco: 12.00, categoria: 'Descartáveis', estoque: 400, imagem: 'https://images.unsplash.com/photo-1586359375245-8151433a5b31?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Garfo e Faca', descricao: 'Kit de talheres descartáveis, pacote com 50 pares.', preco: 10.00, categoria: 'Descartáveis', estoque: 300, imagem: 'https://images.unsplash.com/photo-1586359375245-8151433a5b31?w=400&h=300&fit=crop', status: 'ativo' },
    { nome: 'Guardanapo de Papel', descricao: 'Guardanapo de papel decorado, pacote com 100 unidades.', preco: 8.00, categoria: 'Descartáveis', estoque: 600, imagem: 'https://images.unsplash.com/photo-1586359375245-8151433a5b31?w=400&h=300&fit=crop', status: 'ativo' }
];

// Produtos com promoção
const produtosPromocao = [
    { nome: 'Brownie Nutella - PROMO', descricao: 'Brownie com generosa camada de Nutella - OFERTA ESPECIAL!', preco: 14.00, preco_promocional: 9.90, categoria: 'Doces', estoque: 30, imagem: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', status: 'ativo', desconto: 30 },
    { nome: 'Torta Limão - PROMO', descricao: 'Torta de limão com merengue - 40% OFF!', preco: 25.00, preco_promocional: 15.00, categoria: 'Doces', estoque: 20, imagem: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&h=300&fit=crop', status: 'ativo', desconto: 40 },
    { nome: 'Coxinha - PROMO', descricao: 'Coxinha de frango com catupiry - 20% OFF', preco: 6.00, preco_promocional: 4.80, categoria: 'Salgados', estoque: 80, imagem: 'https://images.unsplash.com/photo-1625938144755-8fa5d1b2e2b2?w=400&h=300&fit=crop', status: 'ativo', desconto: 20 },
    { nome: 'Capuccino - PROMO', descricao: 'Capuccino cremoso - 15% OFF', preco: 8.50, preco_promocional: 7.22, categoria: 'Bebidas', estoque: 100, imagem: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop', status: 'ativo', desconto: 15 },
    { nome: 'Pão Queijo - PROMO', descricao: 'Pão de queijo mineiro - 10% OFF', preco: 4.00, preco_promocional: 3.60, categoria: 'Café da manhã', estoque: 120, imagem: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=300&fit=crop', status: 'ativo', desconto: 10 },
    { nome: 'Macarons - PROMO 55%', descricao: 'Macarons franceses - SUPER DESCONTO!', preco: 32.00, preco_promocional: 14.40, categoria: 'Doces', estoque: 25, imagem: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=300&fit=crop', status: 'ativo', desconto: 55 }
];

// Função para criar usuário de teste se não existir
function criarUsuarioTeste(callback) {
    db.get("SELECT * FROM usuarios WHERE email = 'teste@teste.com'", (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            callback(null);
            return;
        }
        
        if (!user) {
            const salt = bcrypt.genSaltSync(12);
            const hash = bcrypt.hashSync('123456', salt);
            
            db.run(
                "INSERT INTO usuarios (email, password, isAdmin) VALUES (?, ?, ?)",
                ['teste@teste.com', hash, 0],
                function(err) {
                    if (err) {
                        console.error('Erro ao criar usuário:', err);
                        callback(null);
                    } else {
                        console.log('✅ Usuário de teste criado: teste@teste.com / 123456 (ID:', this.lastID, ')');
                        callback(this.lastID);
                    }
                }
            );
        } else {
            console.log('✅ Usuário de teste já existe (ID:', user.id, ')');
            callback(user.id);
        }
    });
}

// Função para inserir produtos
function inserirProdutos(usuarioId) {
    let total = produtosNormais.length + produtosPromocao.length;
    let processados = 0;
    let inseridosNormais = 0;
    let inseridosPromo = 0;
    
    console.log('\n📦 Inserindo produtos...');
    console.log('='.repeat(50));
    
    // Inserir produtos normais
    produtosNormais.forEach(p => {
        db.run(`
            INSERT OR IGNORE INTO products (name, description, price, categoria, imagem, usuario_id, estoque, status, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [p.nome, p.descricao, p.preco, p.categoria, p.imagem, usuarioId, p.estoque, p.status], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    console.log(`⏭️ Produto já existe: ${p.nome}`);
                } else {
                    console.error(`❌ Erro ao inserir ${p.nome}:`, err);
                }
            } else {
                if (this.changes > 0) {
                    inseridosNormais++;
                    console.log(`✅ Produto inserido: ${p.nome} (R$ ${p.preco.toFixed(2)})`);
                } else {
                    console.log(`⏭️ Produto já existe: ${p.nome}`);
                }
            }
            processados++;
            verificarConclusao();
        });
    });
    
    // Inserir produtos com promoção
    produtosPromocao.forEach(p => {
        db.run(`
            INSERT OR IGNORE INTO products (name, description, price, categoria, imagem, usuario_id, estoque, status, promocao, preco_promocional, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `, [p.nome, p.descricao, p.preco, p.categoria, p.imagem, usuarioId, p.estoque, p.status, p.preco_promocional], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    console.log(`⏭️ Produto promo já existe: ${p.nome}`);
                } else {
                    console.error(`❌ Erro ao inserir ${p.nome}:`, err);
                }
            } else {
                if (this.changes > 0) {
                    inseridosPromo++;
                    console.log(`✅ Produto promo inserido: ${p.nome} - ${p.desconto}% OFF`);
                } else {
                    console.log(`⏭️ Produto promo já existe: ${p.nome}`);
                }
            }
            processados++;
            verificarConclusao();
        });
    });
    
    function verificarConclusao() {
        if (processados === total) {
            db.get("SELECT COUNT(*) as total FROM products", (err, result) => {
                const totalProdutos = result ? result.total : 0;
                const totalPromocoes = produtosPromocao.length;
                
                console.log('\n' + '='.repeat(50));
                console.log('🎉 POPULAÇÃO CONCLUÍDA!');
                console.log('='.repeat(50));
                console.log(`📊 Estatísticas:`);
                console.log(`   - Produtos normais inseridos: ${inseridosNormais}`);
                console.log(`   - Produtos promo inseridos: ${inseridosPromo}`);
                console.log(`   - Total no banco: ${totalProdutos}`);
                console.log(`   - Produtos com desconto: ${totalPromocoes}`);
                console.log('\n🔑 Acesse com:');
                console.log(`   Email: teste@teste.com`);
                console.log(`   Senha: 123456`);
                console.log('\n👑 Admin:');
                console.log(`   Email: admin@admin.com`);
                console.log(`   Senha: admin123`);
                console.log('='.repeat(50));
                
                db.close();
            });
        }
    }
}

// Executar
criarUsuarioTeste(inserirProdutos);