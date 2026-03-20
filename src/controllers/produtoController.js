const db = require('../database/connection');
const fs = require('fs');
const path = require('path');

// Renderizar formulário de edição com dados do banco
exports.renderEditForm = async (req, res) => {
    try {
        // Verificar se usuário está logado
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para editar produtos');
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;
        const usuarioId = req.session.user.id;

        console.log('🔍 Buscando produto para edição - ID:', produtoId, 'Usuário:', usuarioId);

        // Buscar produto do banco de dados
        const produto = await db.get(
            'SELECT * FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, usuarioId]
        );

        if (!produto) {
            console.log('❌ Produto não encontrado ou não pertence ao usuário');
            req.flash('errors', 'Produto não encontrado ou você não tem permissão para editá-lo');
            return res.redirect('/meus-produtos');
        }

        console.log('✅ Produto encontrado:', produto.name);

        // Processar imagem
        const produtoComImagem = {
            ...produto,
            imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };

        res.render('editarProduto', { 
            produto: produtoComImagem,
            errors: req.flash('errors'),
            success: req.flash('success')
        });
        
    } catch (error) {
        console.error("❌ Erro ao carregar formulário de edição:", error);
        req.flash('errors', 'Erro ao carregar produto');
        res.redirect('/meus-produtos');
    }
};

// Atualizar produto no banco de dados
exports.updateProduto = async (req, res) => {
    try {
        // Verificar se usuário está logado
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para editar produtos');
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;
        const usuarioId = req.session.user.id;
        const { nome, descricao, preco, categoria, estoque, status } = req.body;

        console.log('📝 Atualizando produto - ID:', produtoId, 'Dados:', { nome, descricao, preco, categoria, estoque, status });

        // Validações básicas
        if (!nome || !descricao || !preco) {
            req.flash('errors', 'Nome, descrição e preço são obrigatórios');
            return res.redirect(`/produtos/editar/${produtoId}`);
        }

        if (isNaN(preco) || preco <= 0) {
            req.flash('errors', 'Preço deve ser um número válido maior que zero');
            return res.redirect(`/produtos/editar/${produtoId}`);
        }

        // Verificar se o produto pertence ao usuário
        const produto = await db.get(
            'SELECT * FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, usuarioId]
        );

        if (!produto) {
            req.flash('errors', 'Produto não encontrado ou você não tem permissão para editá-lo');
            return res.redirect('/meus-produtos');
        }

        // Atualizar no banco de dados
        await db.run(
            `UPDATE products SET 
             name = ?, 
             description = ?, 
             price = ?,
             categoria = ?,
             estoque = ?,
             status = ?
             WHERE id = ? AND usuario_id = ?`,
            [
                nome.trim(),
                descricao.trim(),
                parseFloat(preco),
                categoria || produto.categoria,
                estoque ? parseInt(estoque) : produto.estoque,
                status || 'ativo',
                produtoId,
                usuarioId
            ]
        );

        console.log('✅ Produto atualizado com sucesso!');

        req.flash('success', 'Produto atualizado com sucesso!');
        res.redirect('/meus-produtos');
        
    } catch (error) {
        console.error("❌ Erro ao atualizar produto:", error);
        req.flash('errors', 'Erro ao atualizar produto');
        res.redirect(`/produtos/editar/${req.params.id}`);
    }
};

// Método de teste (manter para compatibilidade)
exports.updateProdutoTeste = exports.updateProduto;