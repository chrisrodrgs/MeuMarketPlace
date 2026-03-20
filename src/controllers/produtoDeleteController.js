const db = require('../database/connection');

exports.deleteProduto = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para deletar produtos');
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;

        const produto = await db.get(
            'SELECT * FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, req.session.user.id]
        );

        if (!produto) {
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/meus-produtos');
        }

        await db.run(
            'DELETE FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, req.session.user.id]
        );

        req.flash('success', 'Produto deletado com sucesso!');
        return res.redirect('/meus-produtos');
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
        req.flash('errors', 'Erro ao deletar produto');
        return res.redirect('/meus-produtos');
    }
};

exports.confirmDelete = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login/index');
        }

        const produtoId = req.params.id;

        const produto = await db.get(
            'SELECT * FROM products WHERE id = ? AND usuario_id = ?',
            [produtoId, req.session.user.id]
        );

        if (!produto) {
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/meus-produtos');
        }

        res.render('confirmar-delecao', {
            produto: produto,
            usuario: req.session.user
        });
    } catch (error) {
        console.error("Erro ao carregar confirmação:", error);
        res.redirect('/meus-produtos');
    }
};