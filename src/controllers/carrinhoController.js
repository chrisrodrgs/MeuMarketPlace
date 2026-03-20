const db = require('../database/connection');

class CarrinhoController {
    
    constructor() {
        // Bind dos métodos para garantir o escopo correto
        this.getCarrinhoAtivo = this.getCarrinhoAtivo.bind(this);
        this.verCarrinho = this.verCarrinho.bind(this);
        this.adicionar = this.adicionar.bind(this);
        this.atualizarQuantidade = this.atualizarQuantidade.bind(this);
        this.remover = this.remover.bind(this);
        this.limpar = this.limpar.bind(this);
        this.getContagemItens = this.getContagemItens.bind(this);
        this.verificarEstoque = this.verificarEstoque.bind(this);
    }

    // Verificar disponibilidade de estoque
    async verificarEstoque(produtoId, quantidade) {
        try {
            const produto = await db.get('SELECT estoque FROM products WHERE id = ?', [produtoId]);
            if (!produto) {
                return { disponivel: false, mensagem: 'Produto não encontrado' };
            }
            
            const estoqueDisponivel = produto.estoque || 0;
            
            if (quantidade > estoqueDisponivel) {
                return { 
                    disponivel: false, 
                    mensagem: `Quantidade indisponível. Estoque atual: ${estoqueDisponivel}`,
                    estoque: estoqueDisponivel
                };
            }
            
            return { disponivel: true, estoque: estoqueDisponivel };
        } catch (error) {
            console.error('Erro ao verificar estoque:', error);
            return { disponivel: false, mensagem: 'Erro ao verificar estoque' };
        }
    }

    // Obter carrinho ativo do usuário
    async getCarrinhoAtivo(usuarioId) {
        try {
            console.log('🔍 Buscando carrinho ativo para usuário:', usuarioId);
            
            let carrinho = await db.get(
                'SELECT * FROM carrinhos WHERE usuario_id = ? AND status = "ativo"',
                [usuarioId]
            );

            if (!carrinho) {
                console.log('🆕 Criando novo carrinho para usuário:', usuarioId);
                const result = await db.run(
                    'INSERT INTO carrinhos (usuario_id) VALUES (?)',
                    [usuarioId]
                );
                carrinho = await db.get('SELECT * FROM carrinhos WHERE id = ?', [result.id]);
            }

            console.log('✅ Carrinho obtido:', carrinho);
            return carrinho;
        } catch (error) {
            console.error('❌ Erro ao obter carrinho ativo:', error);
            throw error;
        }
    }

    // Visualizar carrinho
    async verCarrinho(req, res) {
        console.log('🎯 Rota /carrinho acessada!');
        
        try {
            if (!req.session.user) {
                console.log('❌ Usuário não está logado');
                req.flash('errors', 'Faça login para acessar o carrinho');
                return res.redirect('/login/index');
            }

            const usuarioId = req.session.user.id;
            console.log('✅ Usuário logado ID:', usuarioId);

            const carrinho = await this.getCarrinhoAtivo(usuarioId);
            console.log('✅ Carrinho obtido ID:', carrinho.id);

            // Buscar itens do carrinho com informações de estoque e status
            const itens = await db.all(`
                SELECT ci.*, p.name, p.imagem, p.categoria, p.estoque, p.status, u.email as vendedor
                FROM carrinho_itens ci
                JOIN products p ON ci.produto_id = p.id
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE ci.carrinho_id = ?
                ORDER BY ci.data_adicao DESC
            `, [carrinho.id]);

            console.log(`📦 ${itens.length} itens encontrados no carrinho`);

            // Processar itens e verificar disponibilidade
            const itensProcessados = itens.map(item => {
                const estoqueDisponivel = item.estoque || 0;
                const quantidadeSolicitada = item.quantidade;
                const disponivel = quantidadeSolicitada <= estoqueDisponivel && item.status === 'ativo';
                
                return {
                    ...item,
                    imagemUrl: item.imagem ? `/uploads/produtos/${item.imagem.split('/').pop()}` : null,
                    precoFormatado: Number(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    subtotal: item.quantidade * item.preco_unitario,
                    subtotalFormatado: (item.quantidade * item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    estoqueDisponivel,
                    disponivel,
                    status: item.status,
                    mensagemEstoque: !disponivel 
                        ? (item.status !== 'ativo' 
                            ? 'Produto indisponível para venda' 
                            : `Apenas ${estoqueDisponivel} disponível(is)`)
                        : ''
                };
            });

            // Calcular totais (apenas itens disponíveis)
            const subtotal = itensProcessados
                .filter(item => item.disponivel)
                .reduce((acc, item) => acc + item.subtotal, 0);
            const total = subtotal;

            console.log('💰 Subtotal:', subtotal);
            console.log('📤 Renderizando carrinho.ejs');

            res.render('carrinho', {
                itens: itensProcessados,
                subtotal: subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                total: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                quantidadeItens: itensProcessados.length,
                itensIndisponiveis: itensProcessados.filter(item => !item.disponivel).length,
                user: req.session.user
            });

        } catch (error) {
            console.error('❌ Erro ao ver carrinho:', error);
            req.flash('errors', 'Erro ao carregar carrinho');
            res.redirect('/');
        }
    }

    // Adicionar item ao carrinho (CORRIGIDO COM VERIFICAÇÃO DE STATUS)
    async adicionar(req, res) {
        try {
            console.log('📦 Recebida requisição para adicionar ao carrinho');
            console.log('req.body:', req.body);

            // Verificar se req.body existe
            if (!req.body) {
                console.error('❌ req.body está undefined');
                return res.status(400).json({ error: 'Dados inválidos' });
            }

            const { produtoId, quantidade = 1 } = req.body;

            // Validar produtoId
            if (!produtoId) {
                console.error('❌ produtoId não fornecido');
                return res.status(400).json({ error: 'ID do produto não fornecido' });
            }

            if (!req.session.user) {
                console.log('❌ Usuário não está logado');
                return res.status(401).json({ error: 'Faça login para adicionar ao carrinho' });
            }

            const usuarioId = req.session.user.id;
            console.log('🛒 Adicionando ao carrinho - Produto:', produtoId, 'Quantidade:', quantidade);

            // Validar quantidade
            if (quantidade < 1) {
                return res.status(400).json({ error: 'Quantidade inválida' });
            }

            // Verificar se produto existe e obter estoque e status
            const produto = await db.get('SELECT * FROM products WHERE id = ?', [produtoId]);
            if (!produto) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // VERIFICAÇÃO DE STATUS: produto deve estar ativo
            if (produto.status !== 'ativo') {
                return res.status(400).json({ 
                    error: 'Este produto não está disponível para venda no momento',
                    status: produto.status 
                });
            }

            // Verificar estoque
            const verificacaoEstoque = await this.verificarEstoque(produtoId, quantidade);
            if (!verificacaoEstoque.disponivel) {
                return res.status(400).json({ 
                    error: verificacaoEstoque.mensagem,
                    estoque: verificacaoEstoque.estoque 
                });
            }

            // Obter carrinho ativo
            const carrinho = await this.getCarrinhoAtivo(usuarioId);

            // Verificar se item já existe no carrinho
            const itemExistente = await db.get(
                'SELECT * FROM carrinho_itens WHERE carrinho_id = ? AND produto_id = ?',
                [carrinho.id, produtoId]
            );

            let novaQuantidade = quantidade;
            
            if (itemExistente) {
                novaQuantidade = itemExistente.quantidade + quantidade;
                
                // Verificar se nova quantidade excede estoque
                const verificacaoNovaQuantidade = await this.verificarEstoque(produtoId, novaQuantidade);
                if (!verificacaoNovaQuantidade.disponivel) {
                    return res.status(400).json({ 
                        error: `Quantidade total (${novaQuantidade}) excede o estoque disponível (${verificacaoNovaQuantidade.estoque})`,
                        estoque: verificacaoNovaQuantidade.estoque
                    });
                }

                // Atualizar quantidade
                await db.run(
                    'UPDATE carrinho_itens SET quantidade = ? WHERE carrinho_id = ? AND produto_id = ?',
                    [novaQuantidade, carrinho.id, produtoId]
                );
                console.log('✅ Quantidade atualizada para', novaQuantidade);
            } else {
                // Inserir novo item
                await db.run(
                    'INSERT INTO carrinho_itens (carrinho_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                    [carrinho.id, produtoId, quantidade, produto.price]
                );
                console.log('✅ Novo item adicionado');
            }

            // Atualizar data do carrinho
            await db.run(
                'UPDATE carrinhos SET data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
                [carrinho.id]
            );

            // Buscar contagem atualizada
            const totalItens = await db.get(
                'SELECT SUM(quantidade) as total FROM carrinho_itens WHERE carrinho_id = ?',
                [carrinho.id]
            );

            res.json({
                success: true,
                message: 'Produto adicionado ao carrinho',
                totalItens: totalItens.total || 0,
                quantidadeNoCarrinho: novaQuantidade || quantidade
            });

        } catch (error) {
            console.error('❌ Erro ao adicionar ao carrinho:', error);
            res.status(500).json({ error: 'Erro ao adicionar produto: ' + error.message });
        }
    }

    // Atualizar quantidade
    async atualizarQuantidade(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({ error: 'Não autorizado' });
            }

            const { itemId } = req.params;
            const { quantidade } = req.body;
            const usuarioId = req.session.user.id;

            console.log('🔄 Atualizando quantidade - Item:', itemId, 'Quantidade:', quantidade);

            if (quantidade < 1) {
                return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
            }

            // Verificar se item pertence ao usuário
            const item = await db.get(`
                SELECT ci.*, p.estoque, p.status FROM carrinho_itens ci
                JOIN carrinhos c ON ci.carrinho_id = c.id
                JOIN products p ON ci.produto_id = p.id
                WHERE ci.id = ? AND c.usuario_id = ?
            `, [itemId, usuarioId]);

            if (!item) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }

            // Verificar se produto está ativo
            if (item.status !== 'ativo') {
                return res.status(400).json({ 
                    error: 'Este produto não está mais disponível para venda'
                });
            }

            // Verificar estoque
            const verificacaoEstoque = await this.verificarEstoque(item.produto_id, quantidade);
            if (!verificacaoEstoque.disponivel) {
                return res.status(400).json({ 
                    error: verificacaoEstoque.mensagem,
                    estoque: verificacaoEstoque.estoque
                });
            }

            // Atualizar quantidade
            await db.run(
                'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?',
                [quantidade, itemId]
            );

            // Calcular novo subtotal
            const novoSubtotal = quantidade * item.preco_unitario;

            res.json({
                success: true,
                message: 'Quantidade atualizada',
                novoSubtotal: novoSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            });

        } catch (error) {
            console.error('❌ Erro ao atualizar quantidade:', error);
            res.status(500).json({ error: 'Erro ao atualizar quantidade' });
        }
    }

    // Remover item do carrinho
    async remover(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({ error: 'Não autorizado' });
            }

            const { itemId } = req.params;
            const usuarioId = req.session.user.id;

            console.log('🗑️ Removendo item:', itemId);

            // Verificar se item pertence ao usuário
            const item = await db.get(`
                SELECT ci.* FROM carrinho_itens ci
                JOIN carrinhos c ON ci.carrinho_id = c.id
                WHERE ci.id = ? AND c.usuario_id = ?
            `, [itemId, usuarioId]);

            if (!item) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }

            // Remover item
            await db.run('DELETE FROM carrinho_itens WHERE id = ?', [itemId]);

            res.json({
                success: true,
                message: 'Item removido do carrinho'
            });

        } catch (error) {
            console.error('❌ Erro ao remover item:', error);
            res.status(500).json({ error: 'Erro ao remover item' });
        }
    }

    // Limpar carrinho
    async limpar(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({ error: 'Não autorizado' });
            }

            const usuarioId = req.session.user.id;
            console.log('🧹 Limpando carrinho do usuário:', usuarioId);

            const carrinho = await db.get(
                'SELECT id FROM carrinhos WHERE usuario_id = ? AND status = "ativo"',
                [usuarioId]
            );

            if (carrinho) {
                await db.run('DELETE FROM carrinho_itens WHERE carrinho_id = ?', [carrinho.id]);
                console.log('✅ Carrinho limpo');
            }

            res.json({
                success: true,
                message: 'Carrinho limpo com sucesso'
            });

        } catch (error) {
            console.error('❌ Erro ao limpar carrinho:', error);
            res.status(500).json({ error: 'Erro ao limpar carrinho' });
        }
    }

    // Obter contagem de itens (para o header)
    async getContagemItens(req, res) {
        try {
            if (!req.session.user) {
                return res.json({ total: 0 });
            }

            const usuarioId = req.session.user.id;

            const carrinho = await db.get(
                'SELECT id FROM carrinhos WHERE usuario_id = ? AND status = "ativo"',
                [usuarioId]
            );

            if (!carrinho) {
                return res.json({ total: 0 });
            }

            const totalItens = await db.get(
                'SELECT SUM(quantidade) as total FROM carrinho_itens WHERE carrinho_id = ?',
                [carrinho.id]
            );

            res.json({ total: totalItens.total || 0 });

        } catch (error) {
            console.error('❌ Erro ao obter contagem:', error);
            res.json({ total: 0 });
        }
    }
}

module.exports = new CarrinhoController();