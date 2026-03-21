const db = require('../database/connection');

// Função auxiliar para processar imagens (URL externa ou local)
function processarImagem(imagem) {
    if (!imagem) return null;
    if (imagem.startsWith('http://') || imagem.startsWith('https://')) {
        return imagem;
    }
    if (imagem.includes('uploads/')) {
        return `/${imagem}`;
    }
    return `/uploads/produtos/${imagem.split('/').pop()}`;
}

exports.index = async (req, res) => {
    try {
        const categorias = ['Café da manhã', 'Doces', 'Salgados', 'Bebidas', 'Descartáveis'];

        // Buscar banners ativos
        const banners = await db.all(`
            SELECT * FROM banners 
            WHERE ativo = 1 
            ORDER BY ordem ASC
        `);

        // Buscar produtos em destaque
        const produtosDestaque = await db.all(`
            SELECT p.*, u.email, u.avatar,
                   CASE WHEN p.promocao = 1 AND (p.data_fim_promocao IS NULL OR p.data_fim_promocao > datetime('now')) 
                        THEN p.preco_promocional 
                        ELSE p.price 
                   END as preco_atual,
                   p.promocao as tem_promocao,
                   p.price as preco_original
            FROM products p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.status = 'ativo'
            ORDER BY p.data_criacao DESC 
            LIMIT 8
        `);

        const destaquesProcessados = produtosDestaque.map(produto => {
            const temPromocao = produto.tem_promocao === 1;
            const precoOriginal = produto.preco_original;
            const precoAtual = produto.preco_atual;
            let desconto = 0;
            
            if (temPromocao && precoOriginal > precoAtual) {
                desconto = Math.round((1 - precoAtual / precoOriginal) * 100);
            }
            
            return {
                ...produto,
                imagemUrl: processarImagem(produto.imagem),
                precoFormatado: Number(precoAtual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                precoOriginalFormatado: temPromocao ? Number(precoOriginal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null,
                desconto: desconto,
                temPromocao: temPromocao && desconto > 0
            };
        });

        // Buscar produtos por categoria
        const produtosPorCategoria = {};
        
        for (const categoria of categorias) {
            const produtos = await db.all(`
                SELECT p.*, u.email, u.avatar,
                       CASE WHEN p.promocao = 1 AND (p.data_fim_promocao IS NULL OR p.data_fim_promocao > datetime('now')) 
                            THEN p.preco_promocional 
                            ELSE p.price 
                       END as preco_atual,
                       p.promocao as tem_promocao,
                       p.price as preco_original
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria = ? AND p.status = 'ativo'
                ORDER BY p.data_criacao DESC 
                LIMIT 4
            `, [categoria]);
            
            produtosPorCategoria[categoria] = produtos.map(produto => {
                const temPromocao = produto.tem_promocao === 1;
                const precoOriginal = produto.preco_original;
                const precoAtual = produto.preco_atual;
                let desconto = 0;
                
                if (temPromocao && precoOriginal > precoAtual) {
                    desconto = Math.round((1 - precoAtual / precoOriginal) * 100);
                }
                
                return {
                    ...produto,
                    imagemUrl: processarImagem(produto.imagem),
                    precoFormatado: Number(precoAtual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    precoOriginalFormatado: temPromocao ? Number(precoOriginal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null,
                    desconto: desconto,
                    temPromocao: temPromocao && desconto > 0
                };
            });
        }

        // Carrosséis de promoções
        const maioresDescontos = await db.all(`
            SELECT p.*, u.email, u.avatar,
                   p.preco_promocional as preco_atual,
                   p.price as preco_original
            FROM products p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.status = 'ativo' AND p.promocao = 1 
                  AND (p.data_fim_promocao IS NULL OR p.data_fim_promocao > datetime('now'))
                  AND p.preco_promocional < p.price
            ORDER BY (p.price - p.preco_promocional) / p.price DESC
            LIMIT 6
        `);

        const maioresDescontosProcessados = maioresDescontos.map(produto => {
            const desconto = Math.round((1 - produto.preco_atual / produto.preco_original) * 100);
            return {
                ...produto,
                imagemUrl: processarImagem(produto.imagem),
                precoFormatado: Number(produto.preco_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                precoOriginalFormatado: Number(produto.preco_original).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                desconto: desconto,
                nome: produto.name
            };
        });

        const promocoesRecentes = await db.all(`
            SELECT p.*, u.email, u.avatar,
                   p.preco_promocional as preco_atual,
                   p.price as preco_original
            FROM products p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.status = 'ativo' AND p.promocao = 1 
                  AND (p.data_fim_promocao IS NULL OR p.data_fim_promocao > datetime('now'))
                  AND p.preco_promocional < p.price
            ORDER BY p.data_criacao DESC
            LIMIT 6
        `);

        const promocoesRecentesProcessados = promocoesRecentes.map(produto => {
            const desconto = Math.round((1 - produto.preco_atual / produto.preco_original) * 100);
            return {
                ...produto,
                imagemUrl: processarImagem(produto.imagem),
                precoFormatado: Number(produto.preco_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                precoOriginalFormatado: Number(produto.preco_original).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                desconto: desconto,
                nome: produto.name
            };
        });

        // Estatísticas
        const totalVendedores = await db.get(`SELECT COUNT(DISTINCT usuario_id) as total FROM products WHERE status = 'ativo'`);
        const totalProdutos = await db.get(`SELECT COUNT(*) as total FROM products WHERE status = 'ativo'`);
        const totalClientesSatisfeitos = await db.get(`SELECT COUNT(*) as total FROM avaliacoes WHERE nota >= 4`);

        const stats = {
            vendedores: totalVendedores.total || 0,
            produtos: totalProdutos.total || 0,
            clientesSatisfeitos: totalClientesSatisfeitos.total || 0
        };

        res.render('index', {
            banners: banners || [],
            produtosDestaque: destaquesProcessados,
            produtosPorCategoria: produtosPorCategoria,
            maioresDescontos: maioresDescontosProcessados,
            promocoesRecentes: promocoesRecentesProcessados,
            categorias: categorias,
            stats: stats,
            user: req.session.user || null
        });

    } catch (error) {
        console.error('Erro na home:', error);
        res.render('index', {
            banners: [],
            produtosDestaque: [],
            produtosPorCategoria: {},
            maioresDescontos: [],
            promocoesRecentes: [],
            categorias: ['Café da manhã', 'Doces', 'Salgados', 'Bebidas', 'Descartáveis'],
            stats: { vendedores: 0, produtos: 0, clientesSatisfeitos: 0 },
            user: req.session.user || null
        });
    }
};