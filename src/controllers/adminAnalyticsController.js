const db = require('../database/connection');

class AdminAnalyticsController {
    
    // Dashboard de Analytics
    async dashboard(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            // ===== ESTATÍSTICAS GERAIS =====
            
            // Total de usuários
            const totalUsuarios = await db.get('SELECT COUNT(*) as total FROM usuarios');
            
            // Total de produtos ativos
            const totalProdutos = await db.get('SELECT COUNT(*) as total FROM products WHERE status = "ativo"');
            
            // Total de vendedores (usuários que têm pelo menos 1 produto)
            const totalVendedores = await db.get(`
                SELECT COUNT(DISTINCT usuario_id) as total 
                FROM products 
                WHERE status = 'ativo'
            `);
            
            // Total de avaliações
            const totalAvaliacoes = await db.get('SELECT COUNT(*) as total FROM avaliacoes');
            
            // Média de avaliações
            const mediaAvaliacoes = await db.get('SELECT AVG(nota) as media FROM avaliacoes');
            
            // Total de pedidos
            const totalPedidos = await db.get('SELECT COUNT(*) as total FROM pedidos');
            
            // Valor total vendido
            const valorTotalVendido = await db.get('SELECT SUM(total) as total FROM pedidos WHERE status = "concluido"');
            
            // ===== CRESCIMENTO DE USUÁRIOS =====
            
            // Últimos 6 meses
            const crescimentoUsuarios = await db.all(`
                SELECT 
                    strftime('%Y-%m', data_criacao) as mes,
                    COUNT(*) as total
                FROM usuarios
                WHERE data_criacao >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', data_criacao)
                ORDER BY mes ASC
            `);
            
            // ===== CRESCIMENTO DE PRODUTOS =====
            
            const crescimentoProdutos = await db.all(`
                SELECT 
                    strftime('%Y-%m', data_criacao) as mes,
                    COUNT(*) as total
                FROM products
                WHERE data_criacao >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', data_criacao)
                ORDER BY mes ASC
            `);
            
            // ===== TOP VENDEDORES (usuários que mais venderam) =====
            // CORRIGIDO: usando pr.id em vez de p.id
            const topVendedores = await db.all(`
                SELECT 
                    u.id,
                    u.email,
                    u.avatar,
                    COUNT(pr.id) as total_vendas,
                    SUM(pi.quantidade) as itens_vendidos,
                    SUM(pi.subtotal) as valor_total
                FROM usuarios u
                JOIN products pr ON u.id = pr.usuario_id
                JOIN pedido_itens pi ON pr.id = pi.produto_id
                JOIN pedidos pd ON pi.pedido_id = pd.id
                WHERE pd.status = 'concluido'
                GROUP BY u.id
                ORDER BY valor_total DESC
                LIMIT 10
            `);
            
            // ===== PRODUTOS MAIS VENDIDOS =====
            
            const produtosMaisVendidos = await db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.price,
                    p.categoria,
                    COUNT(pi.id) as total_vendas,
                    SUM(pi.quantidade) as quantidade_vendida,
                    SUM(pi.subtotal) as valor_total,
                    (SELECT AVG(nota) FROM avaliacoes WHERE produto_id = p.id) as media_avaliacoes
                FROM products p
                JOIN pedido_itens pi ON p.id = pi.produto_id
                JOIN pedidos pd ON pi.pedido_id = pd.id
                WHERE pd.status = 'concluido'
                GROUP BY p.id
                ORDER BY quantidade_vendida DESC
                LIMIT 10
            `);
            
            // ===== PRODUTOS MELHOR AVALIADOS =====
            
            const produtosMelhorAvaliados = await db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.price,
                    p.categoria,
                    AVG(a.nota) as media_avaliacoes,
                    COUNT(a.id) as total_avaliacoes
                FROM products p
                LEFT JOIN avaliacoes a ON p.id = a.produto_id
                WHERE a.nota IS NOT NULL
                GROUP BY p.id
                HAVING total_avaliacoes >= 1
                ORDER BY media_avaliacoes DESC, total_avaliacoes DESC
                LIMIT 10
            `);
            
            // ===== VENDAS POR CATEGORIA =====
            
            const vendasPorCategoria = await db.all(`
                SELECT 
                    p.categoria,
                    COUNT(pi.id) as total_vendas,
                    SUM(pi.quantidade) as quantidade_vendida,
                    SUM(pi.subtotal) as valor_total
                FROM products p
                JOIN pedido_itens pi ON p.id = pi.produto_id
                JOIN pedidos pd ON pi.pedido_id = pd.id
                WHERE pd.status = 'concluido' AND p.categoria IS NOT NULL
                GROUP BY p.categoria
                ORDER BY valor_total DESC
            `);
            
            // ===== DISTRIBUIÇÃO DE AVALIAÇÕES =====
            
            const distribuicaoAvaliacoes = await db.all(`
                SELECT 
                    nota,
                    COUNT(*) as total
                FROM avaliacoes
                GROUP BY nota
                ORDER BY nota DESC
            `);
            
            // ===== VENDAS MENSAIS (últimos 12 meses) =====
            
            const vendasMensais = await db.all(`
                SELECT 
                    strftime('%Y-%m', data_pedido) as mes,
                    COUNT(*) as total_pedidos,
                    SUM(total) as valor_total
                FROM pedidos
                WHERE status = 'concluido' AND data_pedido >= date('now', '-12 months')
                GROUP BY strftime('%Y-%m', data_pedido)
                ORDER BY mes ASC
            `);
            
            // ===== CRESCIMENTO DE AVALIAÇÕES =====
            
            const crescimentoAvaliacoes = await db.all(`
                SELECT 
                    strftime('%Y-%m', data_avaliacao) as mes,
                    COUNT(*) as total
                FROM avaliacoes
                WHERE data_avaliacao >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', data_avaliacao)
                ORDER BY mes ASC
            `);
            
            // ===== TAXA DE CONVERSÃO (usuários que compraram) =====
            
            const usuariosComCompra = await db.get(`
                SELECT COUNT(DISTINCT usuario_id) as total
                FROM pedidos
                WHERE status = 'concluido'
            `);
            
            const taxaConversao = totalUsuarios.total > 0 
                ? (usuariosComCompra.total / totalUsuarios.total * 100).toFixed(1)
                : 0;
            
            // ===== TICKET MÉDIO =====
            
            const ticketMedio = valorTotalVendido.total > 0 && totalPedidos.total > 0
                ? (valorTotalVendido.total / totalPedidos.total).toFixed(2)
                : 0;
            
            res.render('admin/analytics', {
                stats: {
                    totalUsuarios: totalUsuarios.total,
                    totalProdutos: totalProdutos.total,
                    totalVendedores: totalVendedores.total,
                    totalAvaliacoes: totalAvaliacoes.total,
                    mediaAvaliacoes: mediaAvaliacoes.media ? mediaAvaliacoes.media.toFixed(1) : 0,
                    totalPedidos: totalPedidos.total,
                    valorTotalVendido: valorTotalVendido.total || 0,
                    ticketMedio: ticketMedio,
                    taxaConversao: taxaConversao
                },
                crescimentoUsuarios: crescimentoUsuarios,
                crescimentoProdutos: crescimentoProdutos,
                topVendedores: topVendedores,
                produtosMaisVendidos: produtosMaisVendidos,
                produtosMelhorAvaliados: produtosMelhorAvaliados,
                vendasPorCategoria: vendasPorCategoria,
                distribuicaoAvaliacoes: distribuicaoAvaliacoes,
                vendasMensais: vendasMensais,
                crescimentoAvaliacoes: crescimentoAvaliacoes,
                user: req.session.user,
                errors: req.flash('errors'),
                success: req.flash('success')
            });

        } catch (error) {
            console.error('Erro no analytics:', error);
            req.flash('errors', 'Erro ao carregar dados');
            res.redirect('/admin');
        }
    }
    
    // API para dados em JSON (para gráficos)
    async apiDados(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            
            const { tipo, periodo } = req.query;
            
            let dados = {};
            
            switch(tipo) {
                case 'vendas':
                    dados = await db.all(`
                        SELECT 
                            strftime('%Y-%m', data_pedido) as data,
                            COUNT(*) as total_pedidos,
                            SUM(total) as valor_total
                        FROM pedidos
                        WHERE status = 'concluido'
                        GROUP BY strftime('%Y-%m', data_pedido)
                        ORDER BY data ASC
                        LIMIT 12
                    `);
                    break;
                    
                case 'usuarios':
                    dados = await db.all(`
                        SELECT 
                            strftime('%Y-%m', data_criacao) as data,
                            COUNT(*) as total
                        FROM usuarios
                        GROUP BY strftime('%Y-%m', data_criacao)
                        ORDER BY data ASC
                        LIMIT 12
                    `);
                    break;
                    
                case 'avaliacoes':
                    dados = await db.all(`
                        SELECT 
                            nota,
                            COUNT(*) as total
                        FROM avaliacoes
                        GROUP BY nota
                        ORDER BY nota DESC
                    `);
                    break;
                    
                default:
                    dados = {};
            }
            
            res.json(dados);
            
        } catch (error) {
            console.error('Erro na API de analytics:', error);
            res.status(500).json({ error: 'Erro ao carregar dados' });
        }
    }
    
    // Exportar relatório
    async exportarRelatorio(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }
            
            const { formato, periodo } = req.query;
            
            // Buscar dados para o relatório
            const dados = await db.all(`
                SELECT 
                    p.id as pedido_id,
                    p.data_pedido,
                    p.total,
                    p.status,
                    u.email as cliente_email,
                    pi.produto_id,
                    pr.name as produto_nome,
                    pi.quantidade,
                    pi.preco_unitario,
                    pi.subtotal
                FROM pedidos p
                JOIN usuarios u ON p.usuario_id = u.id
                JOIN pedido_itens pi ON p.id = pi.pedido_id
                JOIN products pr ON pi.produto_id = pr.id
                WHERE p.status = 'concluido'
                ORDER BY p.data_pedido DESC
            `);
            
            if (formato === 'csv') {
                // Gerar CSV
                const headers = ['ID Pedido', 'Data', 'Cliente', 'Produto', 'Quantidade', 'Preço Unitário', 'Subtotal', 'Total Pedido', 'Status'];
                const rows = dados.map(d => [
                    d.pedido_id,
                    new Date(d.data_pedido).toLocaleDateString('pt-BR'),
                    d.cliente_email,
                    d.produto_nome,
                    d.quantidade,
                    d.preco_unitario,
                    d.subtotal,
                    d.total,
                    d.status
                ]);
                
                let csv = headers.join(',') + '\n';
                rows.forEach(row => {
                    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
                });
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=relatorio_${new Date().toISOString().slice(0,10)}.csv`);
                res.send(csv);
                
            } else {
                // JSON
                res.json(dados);
            }
            
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            req.flash('errors', 'Erro ao exportar relatório');
            res.redirect('/admin/analytics');
        }
    }
}

module.exports = new AdminAnalyticsController();