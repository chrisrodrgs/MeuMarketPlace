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

class AvaliacaoController {
    
    // Avaliar um produto
    async avaliar(req, res) {
        try {
            const { produtoId } = req.params;
            const { nota, comentario } = req.body;
            const usuarioId = req.session.user.id;

            if (!nota || nota < 1 || nota > 5) {
                req.flash('errors', 'A nota deve ser entre 1 e 5');
                return res.redirect(`/produto/${produtoId}`);
            }

            const produto = await db.get('SELECT * FROM products WHERE id = ?', [produtoId]);
            if (!produto) {
                req.flash('errors', 'Produto não encontrado');
                return res.redirect('/');
            }

            const avaliacaoExistente = await db.get(
                'SELECT * FROM avaliacoes WHERE produto_id = ? AND usuario_id = ?',
                [produtoId, usuarioId]
            );

            if (avaliacaoExistente) {
                await db.run(
                    `UPDATE avaliacoes 
                     SET nota = ?, comentario = ?, data_avaliacao = CURRENT_TIMESTAMP 
                     WHERE produto_id = ? AND usuario_id = ?`,
                    [nota, comentario || null, produtoId, usuarioId]
                );
                req.flash('success', 'Avaliação atualizada com sucesso!');
            } else {
                await db.run(
                    `INSERT INTO avaliacoes (produto_id, usuario_id, nota, comentario) 
                     VALUES (?, ?, ?, ?)`,
                    [produtoId, usuarioId, nota, comentario || null]
                );
                req.flash('success', 'Avaliação enviada com sucesso!');
            }

            res.redirect(`/produto/${produtoId}`);

        } catch (error) {
            console.error('Erro ao avaliar produto:', error);
            req.flash('errors', 'Erro ao processar avaliação');
            res.redirect('back');
        }
    }

    // Buscar avaliações de um produto (API)
    async getAvaliacoes(req, res) {
        try {
            const { produtoId } = req.params;

            const avaliacoes = await db.all(`
                SELECT a.*, u.email, u.avatar 
                FROM avaliacoes a
                JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.produto_id = ?
                ORDER BY a.data_avaliacao DESC
            `, [produtoId]);

            const media = avaliacoes.length > 0
                ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1)
                : 0;

            const distribuicao = {
                1: avaliacoes.filter(a => a.nota === 1).length,
                2: avaliacoes.filter(a => a.nota === 2).length,
                3: avaliacoes.filter(a => a.nota === 3).length,
                4: avaliacoes.filter(a => a.nota === 4).length,
                5: avaliacoes.filter(a => a.nota === 5).length
            };

            let avaliacaoUsuario = null;
            if (req.session.user) {
                avaliacaoUsuario = await db.get(
                    'SELECT * FROM avaliacoes WHERE produto_id = ? AND usuario_id = ?',
                    [produtoId, req.session.user.id]
                );
            }

            res.json({
                avaliacoes,
                media,
                total: avaliacoes.length,
                distribuicao,
                avaliacaoUsuario
            });

        } catch (error) {
            console.error('Erro ao buscar avaliações:', error);
            res.status(500).json({ error: 'Erro ao buscar avaliações' });
        }
    }

    // Deletar avaliação
    async deletar(req, res) {
        try {
            const { avaliacaoId } = req.params;
            const usuarioId = req.session.user.id;

            const result = await db.run(
                'DELETE FROM avaliacoes WHERE id = ? AND usuario_id = ?',
                [avaliacaoId, usuarioId]
            );

            if (result.changes > 0) {
                req.flash('success', 'Avaliação removida com sucesso!');
            } else {
                req.flash('errors', 'Avaliação não encontrada');
            }

            res.redirect('back');

        } catch (error) {
            console.error('Erro ao deletar avaliação:', error);
            req.flash('errors', 'Erro ao deletar avaliação');
            res.redirect('back');
        }
    }

    // Página do produto com avaliações
    async paginaProduto(req, res) {
        try {
            const { produtoId } = req.params;

            console.log('🎯 Carregando produto ID:', produtoId);

            // Buscar dados do produto
            const produto = await db.get(`
                SELECT p.*, u.email, u.avatar 
                FROM products p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = ?
            `, [produtoId]);

            if (!produto) {
                console.log('❌ Produto não encontrado');
                return res.status(404).render('404');
            }

            console.log('✅ Produto encontrado:', produto.name);

            // Processar imagem (suporta URL externa)
            produto.imagemUrl = processarImagem(produto.imagem);
            produto.precoFormatado = Number(produto.price).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            });

            // Buscar avaliações
            const avaliacoes = await db.all(`
                SELECT a.*, u.email, u.avatar 
                FROM avaliacoes a
                JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.produto_id = ?
                ORDER BY a.data_avaliacao DESC
                LIMIT 10
            `, [produtoId]);

            console.log(`📊 ${avaliacoes.length} avaliações encontradas`);

            // Processar avaliações
            const avaliacoesProcessadas = avaliacoes.map(av => ({
                ...av,
                avatarUrl: av.avatar ? (av.avatar.startsWith('http') ? av.avatar : `/uploads/avatars/${av.avatar.split('/').pop()}`) : null,
                dataFormatada: new Date(av.data_avaliacao).toLocaleDateString('pt-BR'),
                estrelas: Array(5).fill(false).map((_, i) => i < av.nota)
            }));

            // Calcular estatísticas
            const totalResult = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ?', [produtoId]);
            const total = totalResult ? totalResult.count : 0;
            
            const mediaResult = await db.get('SELECT AVG(nota) as media FROM avaliacoes WHERE produto_id = ?', [produtoId]);
            const media = mediaResult && mediaResult.media ? mediaResult.media.toFixed(1) : 0;

            // Distribuição das notas
            const dist1 = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ? AND nota = 1', [produtoId]);
            const dist2 = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ? AND nota = 2', [produtoId]);
            const dist3 = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ? AND nota = 3', [produtoId]);
            const dist4 = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ? AND nota = 4', [produtoId]);
            const dist5 = await db.get('SELECT COUNT(*) as count FROM avaliacoes WHERE produto_id = ? AND nota = 5', [produtoId]);

            const stats = {
                total: total,
                media: media,
                distribuicao: {
                    1: dist1 ? dist1.count : 0,
                    2: dist2 ? dist2.count : 0,
                    3: dist3 ? dist3.count : 0,
                    4: dist4 ? dist4.count : 0,
                    5: dist5 ? dist5.count : 0
                }
            };

            console.log('📈 Estatísticas:', stats);

            // Verificar se usuário já avaliou
            let avaliacaoUsuario = null;
            if (req.session.user) {
                avaliacaoUsuario = await db.get(
                    'SELECT * FROM avaliacoes WHERE produto_id = ? AND usuario_id = ?',
                    [produtoId, req.session.user.id]
                );
            }

            // Produtos relacionados
            const relacionados = await db.all(`
                SELECT p.*, u.email 
                FROM products p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.categoria = ? AND p.id != ?
                ORDER BY RANDOM()
                LIMIT 4
            `, [produto.categoria, produtoId]);

            const relacionadosProcessados = relacionados.map(p => ({
                ...p,
                imagemUrl: processarImagem(p.imagem),
                precoFormatado: Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }));

            res.render('produto', {
                produto,
                avaliacoes: avaliacoesProcessadas,
                stats,
                avaliacaoUsuario,
                relacionados: relacionadosProcessados,
                user: req.session.user
            });

        } catch (error) {
            console.error('❌ Erro ao carregar produto:', error);
            res.status(500).render('404');
        }
    }
}

module.exports = new AvaliacaoController();