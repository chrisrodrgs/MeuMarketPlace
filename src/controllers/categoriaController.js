const db = require('../database/connection');

class CategoriaController {
    // Página de categoria específica
    async index(req, res) {
        try {
            const { categoria } = req.params;
            const { ordenar, preco, avaliacao, pagina = 1 } = req.query;
            
            // Decodificar nome da categoria
            const nomeCategoria = decodeURIComponent(categoria);
            
            // Produtos por página
            const porPagina = 12;
            const offset = (pagina - 1) * porPagina;
            
            // Construir query base com LEFT JOIN para incluir produtos sem avaliações
            let query = `
                SELECT p.*, u.email, u.avatar,
                       COALESCE(AVG(a.nota), 0) as media_avaliacoes,
                       COUNT(a.id) as total_avaliacoes
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                LEFT JOIN avaliacoes a ON p.id = a.produto_id
                WHERE p.categoria = ?
            `;
            
            let countQuery = `
                SELECT COUNT(DISTINCT p.id) as total 
                FROM products p 
                WHERE p.categoria = ?
            `;
            
            let params = [nomeCategoria];
            let countParams = [nomeCategoria];
            
            // Aplicar filtro de preço
            if (preco) {
                if (preco === '0-50') {
                    query += ` AND p.price <= 50`;
                    countQuery += ` AND price <= 50`;
                } else if (preco === '50-100') {
                    query += ` AND p.price > 50 AND p.price <= 100`;
                    countQuery += ` AND price > 50 AND price <= 100`;
                } else if (preco === '100-200') {
                    query += ` AND p.price > 100 AND p.price <= 200`;
                    countQuery += ` AND price > 100 AND price <= 200`;
                } else if (preco === '200+') {
                    query += ` AND p.price > 200`;
                    countQuery += ` AND price > 200`;
                }
            }
            
            query += ` GROUP BY p.id`;
            
            // Aplicar filtro por avaliação (mínima)
            if (avaliacao && avaliacao !== '0') {
                query += ` HAVING COALESCE(AVG(a.nota), 0) >= ?`;
                params.push(parseFloat(avaliacao));
            }
            
            // Aplicar ordenação
            if (ordenar === 'preco_asc') {
                query += ` ORDER BY p.price ASC`;
            } else if (ordenar === 'preco_desc') {
                query += ` ORDER BY p.price DESC`;
            } else if (ordenar === 'nome_asc') {
                query += ` ORDER BY p.name ASC`;
            } else if (ordenar === 'nome_desc') {
                query += ` ORDER BY p.name DESC`;
            } else if (ordenar === 'melhores_avaliacoes') {
                query += ` ORDER BY media_avaliacoes DESC, total_avaliacoes DESC`;
            } else if (ordenar === 'mais_avaliados') {
                query += ` ORDER BY total_avaliacoes DESC, media_avaliacoes DESC`;
            } else {
                query += ` ORDER BY p.data_criacao DESC`; // padrão: mais recentes
            }
            
            // Aplicar paginação
            query += ` LIMIT ? OFFSET ?`;
            params.push(porPagina, offset);
            
            // Buscar produtos
            const produtos = await db.all(query, params);
            
            // Buscar total de produtos para paginação
            const totalResult = await db.get(countQuery, countParams);
            const totalProdutos = totalResult ? totalResult.total : 0;
            
            // Processar imagens e formatar preços
            const produtosProcessados = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }),
                mediaAvaliacoes: produto.media_avaliacoes ? Number(produto.media_avaliacoes).toFixed(1) : 0,
                totalAvaliacoes: produto.total_avaliacoes || 0
            }));
            
            // Buscar categorias para menu lateral
            const categorias = await db.all(`
                SELECT categoria, COUNT(*) as total 
                FROM products 
                WHERE categoria IS NOT NULL 
                GROUP BY categoria 
                ORDER BY categoria
            `);
            
            // Calcular páginas
            const totalPaginas = Math.ceil(totalProdutos / porPagina);
            
            res.render('categoria', {
                categoria: nomeCategoria,
                produtos: produtosProcessados,
                categorias,
                totalProdutos,
                paginaAtual: parseInt(pagina),
                totalPaginas,
                filtros: { ordenar, preco, avaliacao },
                user: req.session.user || null
            });
            
        } catch (error) {
            console.error('Erro na página de categoria:', error);
            res.status(500).render('categoria', {
                categoria: req.params.categoria,
                produtos: [],
                categorias: [],
                totalProdutos: 0,
                paginaAtual: 1,
                totalPaginas: 1,
                filtros: {},
                user: req.session.user || null
            });
        }
    }
    
    // Listar todas as categorias
    async listarTodos(req, res) {
        try {
            const categorias = await db.all(`
                SELECT categoria, COUNT(*) as total,
                       MIN(price) as preco_min,
                       MAX(price) as preco_max
                FROM products 
                WHERE categoria IS NOT NULL 
                GROUP BY categoria 
                ORDER BY total DESC
            `);
            
            // Buscar produtos recentes de cada categoria
            const categoriasComProdutos = await Promise.all(
                categorias.map(async (cat) => {
                    const produtos = await db.all(`
                        SELECT p.*, u.email,
                               COALESCE(AVG(a.nota), 0) as media_avaliacoes,
                               COUNT(a.id) as total_avaliacoes
                        FROM products p 
                        JOIN usuarios u ON p.usuario_id = u.id 
                        LEFT JOIN avaliacoes a ON p.id = a.produto_id
                        WHERE p.categoria = ? 
                        GROUP BY p.id
                        ORDER BY p.data_criacao DESC 
                        LIMIT 4
                    `, [cat.categoria]);
                    
                    const produtosProcessados = produtos.map(produto => ({
                        ...produto,
                        imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                        precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                        }),
                        mediaAvaliacoes: produto.media_avaliacoes ? Number(produto.media_avaliacoes).toFixed(1) : 0,
                        totalAvaliacoes: produto.total_avaliacoes || 0
                    }));
                    
                    return {
                        ...cat,
                        produtos: produtosProcessados
                    };
                })
            );
            
            res.render('categorias', {
                categorias: categoriasComProdutos,
                user: req.session.user || null
            });
            
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).render('categorias', {
                categorias: [],
                user: req.session.user || null
            });
        }
    }
}

module.exports = new CategoriaController();