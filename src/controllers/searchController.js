const db = require('../database/connection');

class SearchController {
    // Página de busca
    async index(req, res) {
        try {
            const { q, categoria, ordem, precoMin, precoMax } = req.query;
            
            // Construir query base
            let query = `
                SELECT p.*, u.email, u.avatar 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE 1=1
            `;
            let params = [];

            // Filtro por termo de busca
            if (q) {
                query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`);
            }

            // Filtro por categoria
            if (categoria && categoria !== 'todas') {
                query += ` AND p.categoria = ?`;
                params.push(categoria);
            }

            // Filtro por preço mínimo
            if (precoMin) {
                query += ` AND p.price >= ?`;
                params.push(parseFloat(precoMin));
            }

            // Filtro por preço máximo
            if (precoMax) {
                query += ` AND p.price <= ?`;
                params.push(parseFloat(precoMax));
            }

            // Ordenação
            switch(ordem) {
                case 'preco_asc':
                    query += ` ORDER BY p.price ASC`;
                    break;
                case 'preco_desc':
                    query += ` ORDER BY p.price DESC`;
                    break;
                case 'recentes':
                default:
                    query += ` ORDER BY p.data_criacao DESC`;
                    break;
            }

            // Executar busca
            const produtos = await db.all(query, params);

            // Processar imagens e formatar preços
            const produtosProcessados = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));

            // Buscar categorias para o filtro
            const categorias = await db.all(`
                SELECT DISTINCT categoria, COUNT(*) as total 
                FROM products 
                WHERE categoria IS NOT NULL 
                GROUP BY categoria 
                ORDER BY categoria
            `);

            // Estatísticas da busca
            const stats = {
                total: produtos.length,
                termo: q || 'Todos os produtos',
                precoMin: produtos.length > 0 ? Math.min(...produtos.map(p => p.price)) : 0,
                precoMax: produtos.length > 0 ? Math.max(...produtos.map(p => p.price)) : 0
            };

            res.render('search/results', {
                produtos: produtosProcessados,
                categorias,
                stats,
                filtros: { q, categoria, ordem, precoMin, precoMax },
                user: req.session.user || null
            });

        } catch (error) {
            console.error('Erro na busca:', error);
            res.status(500).render('search/results', {
                produtos: [],
                categorias: [],
                stats: { total: 0, termo: 'Erro na busca' },
                filtros: {},
                user: req.session.user || null
            });
        }
    }

    // Busca rápida para o header (AJAX)
    async quickSearch(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 2) {
                return res.json({ produtos: [] });
            }

            const produtos = await db.all(`
                SELECT p.id, p.name, p.price, p.categoria, p.imagem,
                       u.email as vendedor
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.name LIKE ? OR p.description LIKE ?
                ORDER BY p.data_criacao DESC 
                LIMIT 5
            `, [`%${q}%`, `%${q}%`]);

            const resultados = produtos.map(produto => ({
                id: produto.id,
                name: produto.name,
                price: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                categoria: produto.categoria,
                vendedor: produto.vendedor.split('@')[0],
                imagem: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null
            }));

            res.json({ produtos: resultados });

        } catch (error) {
            console.error('Erro na busca rápida:', error);
            res.status(500).json({ produtos: [] });
        }
    }

    // Página de categoria específica
    async categoria(req, res) {
        try {
            const { nome } = req.params;
            
            const produtos = await db.all(`
                SELECT p.*, u.email, u.avatar 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria = ?
                ORDER BY p.data_criacao DESC
            `, [nome]);

            const produtosProcessados = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));

            // Produtos relacionados (outras categorias)
            const relacionados = await db.all(`
                SELECT p.*, u.email 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria != ?
                ORDER BY RANDOM()
                LIMIT 4
            `, [nome]);

            const relacionadosProcessados = relacionados.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));

            res.render('search/categoria', {
                categoria: nome,
                produtos: produtosProcessados,
                relacionados: relacionadosProcessados,
                total: produtos.length,
                user: req.session.user || null
            });

        } catch (error) {
            console.error('Erro na página de categoria:', error);
            res.status(500).send('Erro ao carregar categoria');
        }
    }
}

module.exports = new SearchController();