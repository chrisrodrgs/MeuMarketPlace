const db = require('../database/connection');

exports.index = async (req, res) => {
    try {
        // Categorias disponíveis
        const categorias = [
            'Café da manhã',
            'Doces',
            'Salgados',
            'Bebidas',
            'Descartáveis'
        ];

        // Buscar produtos em destaque (mais recentes)
        const produtosDestaque = await db.all(`
            SELECT p.*, u.email, u.avatar 
            FROM products p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.status = 'ativo'
            ORDER BY p.data_criacao DESC 
            LIMIT 8
        `);

        // Processar imagens dos produtos em destaque
        const destaquesProcessados = produtosDestaque.map(produto => ({
            ...produto,
            imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }));

        // Buscar produtos por categoria (apenas ativos)
        const produtosPorCategoria = {};
        
        for (const categoria of categorias) {
            const produtos = await db.all(`
                SELECT p.*, u.email, u.avatar 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria = ? AND p.status = 'ativo'
                ORDER BY p.data_criacao DESC 
                LIMIT 4
            `, [categoria]);
            
            produtosPorCategoria[categoria] = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));
        }

        // ===== ESTATÍSTICAS REAIS =====
        
        // Total de vendedores (usuários que têm pelo menos 1 produto ativo)
        const totalVendedores = await db.get(`
            SELECT COUNT(DISTINCT usuario_id) as total 
            FROM products 
            WHERE status = 'ativo'
        `);
        
        // Total de produtos ativos
        const totalProdutos = await db.get(`
            SELECT COUNT(*) as total 
            FROM products 
            WHERE status = 'ativo'
        `);
        
        // Total de avaliações com nota >= 4 (clientes satisfeitos)
        const totalClientesSatisfeitos = await db.get(`
            SELECT COUNT(*) as total 
            FROM avaliacoes 
            WHERE nota >= 4
        `);

        // Estatísticas para o contador animado
        const stats = {
            vendedores: totalVendedores.total || 0,
            produtos: totalProdutos.total || 0,
            clientesSatisfeitos: totalClientesSatisfeitos.total || 0
        };

        console.log('📊 Estatísticas da Home:', stats);

        res.render('index', {
            produtosDestaque: destaquesProcessados,
            produtosPorCategoria: produtosPorCategoria,
            categorias: categorias,
            stats: stats,
            user: req.session.user || null
        });

    } catch (error) {
        console.error('Erro na home:', error);
        res.render('index', {
            produtosDestaque: [],
            produtosPorCategoria: {},
            categorias: ['Café da manhã', 'Doces', 'Salgados', 'Bebidas', 'Descartáveis'],
            stats: { vendedores: 0, produtos: 0, clientesSatisfeitos: 0 },
            user: req.session.user || null
        });
    }
};