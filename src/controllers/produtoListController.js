const db = require('../database/connection');

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
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para acessar seus produtos');
            return res.redirect('/login/index');
        }

        const usuarioId = req.session.user.id;

        const produtos = await db.all(
            `SELECT * FROM products WHERE usuario_id = ? ORDER BY id DESC`,
            [usuarioId]
        );

        const produtosProcessados = produtos.map(produto => ({
            ...produto,
            imagemUrl: processarImagem(produto.imagem),
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            })
        }));

        const success = req.flash('success');
        const errors = req.flash('errors');

        res.render('meus-produtos', { 
            produtos: produtosProcessados,
            usuario: req.session.user,
            success: success.length > 0 ? success : null,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        console.error("Erro ao listar produtos:", error);
        req.flash('errors', 'Erro ao carregar produtos');
        return res.redirect('/');
    }
};

exports.listarPorUsuarioId = async (req, res) => {
    try {
        const usuarioId = req.params.id;

        const produtos = await db.all(
            `SELECT p.*, u.email as usuario_email, u.avatar as usuario_avatar
             FROM products p 
             JOIN usuarios u ON p.usuario_id = u.id 
             WHERE p.usuario_id = ? 
             ORDER BY p.id DESC`,
            [usuarioId]
        );

        const produtosProcessados = produtos.map(produto => ({
            ...produto,
            imagemUrl: processarImagem(produto.imagem),
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }),
            avatarUrl: produto.usuario_avatar ? `/uploads/avatars/${produto.usuario_avatar.split('/').pop()}` : null
        }));

        res.render('produtos-usuario', { 
            produtos: produtosProcessados,
            usuarioId: usuarioId
        });

    } catch (error) {
        console.error("Erro ao listar produtos do usuário:", error);
        res.status(500).send("Erro ao carregar produtos");
    }
};