const db = require('../database/connection');

class CategoriaController {
    // Página de categoria específica
    async index(req, res) {
        try {
            const { categoria } = req.params;
            const { ordenar, preco, pagina = 1 } = req.query;
            
            // Decodificar nome da categoria (ex: "Café da manhã" -> "Café da manhã")
            const nomeCategoria = decodeURIComponent(categoria);
            
            // Produtos por página
            const porPagina = 12;
            const offset = (pagina - 1) * porPagina;
            
            // Construir query base
            let query = `
                SELECT p.*, u.email, u.avatar 
                FROM products p 
                JOIN usuarios u ON p.usuario_id = u.id 
                WHERE p.categoria = ?
            `;
            let countQuery = `SELECT COUNT(*) as total FROM products WHERE categoria = ?`;
            let params = [nomeCategoria];
            
            // Aplicar filtro de preço
            if (preco) {
                if (preco === '0-50') {
                    query += ` AND p.price <= 50`;
                } else if (preco === '50-100') {
                    query += ` AND p.price > 50 AND p.price <= 100`;
                } else if (preco === '100-200') {
                    query += ` AND p.price > 100 AND p.price <= 200`;
                } else if (preco === '200+') {
                    query += ` AND p.price > 200`;
                }
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
            } else {
                query += ` ORDER BY p.data_criacao DESC`; // padrão: mais recentes
            }
            
            // Aplicar paginação
            query += ` LIMIT ? OFFSET ?`;
            params.push(porPagina, offset);
            
            // Buscar produtos
            const produtos = await db.all(query, params);
            
            // Buscar total de produtos para paginação
            const totalResult = await db.get(countQuery, [nomeCategoria]);
            const totalProdutos = totalResult.total;
            
            // Processar imagens e formatar preços
            const produtosProcessados = produtos.map(produto => ({
                ...produto,
                imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                })
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
                filtros: { ordenar, preco },
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
    
    // Listar todas as categorias (para página de categorias)
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
                        SELECT p.*, u.email 
                        FROM products p 
                        JOIN usuarios u ON p.usuario_id = u.id 
                        WHERE p.categoria = ? 
                        ORDER BY p.data_criacao DESC 
                        LIMIT 4
                    `, [cat.categoria]);
                    
                    const produtosProcessados = produtos.map(produto => ({
                        ...produto,
                        imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
                        precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                        })
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