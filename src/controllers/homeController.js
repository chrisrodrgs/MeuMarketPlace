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
            ORDER BY p.data_criacao DESC 
            LIMIT 8
        `);

        // Processar imagens dos produtos em destaque
        const destaquesProcessados = produtosDestaque.map(produto => ({
            ...produto,
            imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }));

        // Buscar produtos por categoria
        const produtosPorCategoria = {};
        
        for (const categoria of categorias) {
            const produtos = await db.all(`
                SELECT p.*, u.email, u.avatar 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria = ? 
                ORDER BY p.data_criacao DESC 
                LIMIT 4
            `, [categoria]);
            
            // Processar imagens dos produtos da categoria
            produtosPorCategoria[categoria] = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));
        }

        // Estatísticas para o contador animado
        const totalProdutos = await db.get('SELECT COUNT(*) as total FROM products');
        const totalUsuarios = await db.get('SELECT COUNT(*) as total FROM usuarios');

        res.render('index', {
            produtosDestaque: destaquesProcessados,
            produtosPorCategoria: produtosPorCategoria,
            categorias: categorias,
            totalProdutos: totalProdutos.total,
            totalUsuarios: totalUsuarios.total,
            user: req.session.user || null
        });

    } catch (error) {
        console.error('Erro na home:', error);
        res.render('index', {
            produtosDestaque: [],
            produtosPorCategoria: {},
            categorias: ['Café da manhã', 'Doces', 'Salgados', 'Bebidas', 'Descartáveis'],
            totalProdutos: 0,
            totalUsuarios: 0,
            user: req.session.user || null
        });
    }
};