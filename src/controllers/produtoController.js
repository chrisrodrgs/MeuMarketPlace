const db = require('../database/connection');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const multerConfig = require('../config/multerConfig');
const upload = multer(multerConfig).single('imagem');

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

// Renderizar formulário de edição
exports.renderEditForm = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para editar produtos');
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;
        const usuarioId = req.session.user.id;

        const produto = await db.get(
            'SELECT * FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, usuarioId]
        );

        if (!produto) {
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/meus-produtos');
        }

        const produtoComImagem = {
            ...produto,
            imagemUrl: processarImagem(produto.imagem),
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };

        res.render('editarProduto', { 
            produto: produtoComImagem,
            errors: req.flash('errors'),
            success: req.flash('success')
        });
        
    } catch (error) {
        console.error("Erro ao carregar formulário de edição:", error);
        req.flash('errors', 'Erro ao carregar produto');
        res.redirect('/meus-produtos');
    }
};

// Middleware para upload de imagem na edição
exports.uploadImagem = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            req.flash('errors', `Erro no upload: ${err.message}`);
            return res.redirect(`/produtos/editar/${req.params.id}`);
        } else if (err) {
            req.flash('errors', err.message);
            return res.redirect(`/produtos/editar/${req.params.id}`);
        }
        next();
    });
};

// Atualizar produto com imagem
exports.updateProduto = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para editar produtos');
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;
        const usuarioId = req.session.user.id;
        const { nome, descricao, preco, categoria, estoque, status } = req.body;

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
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/meus-produtos');
        }

        // Processar nova imagem se foi enviada
        let imagemPath = produto.imagem;
        
        if (req.file) {
            // Deletar imagem antiga se for local (não URL externa)
            if (produto.imagem && !produto.imagem.startsWith('http://') && !produto.imagem.startsWith('https://')) {
                const oldImagePath = path.join(__dirname, '..', '..', 'public', produto.imagem);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            // Salvar nova imagem
            imagemPath = `uploads/produtos/${req.file.filename}`;
        }

        // Atualizar no banco
        await db.run(
            `UPDATE products SET 
             name = ?, 
             description = ?, 
             price = ?,
             categoria = ?,
             estoque = ?,
             status = ?,
             imagem = ?
             WHERE id = ? AND usuario_id = ?`,
            [
                nome.trim(),
                descricao.trim(),
                parseFloat(preco),
                categoria || produto.categoria,
                estoque ? parseInt(estoque) : produto.estoque,
                status || 'ativo',
                imagemPath,
                produtoId,
                usuarioId
            ]
        );

        req.flash('success', 'Produto atualizado com sucesso!');
        res.redirect('/meus-produtos');
        
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        req.flash('errors', 'Erro ao atualizar produto');
        res.redirect(`/produtos/editar/${req.params.id}`);
    }
};