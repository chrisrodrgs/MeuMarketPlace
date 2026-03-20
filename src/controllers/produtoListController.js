const db = require('../database/connection');

// Listar produtos do usuário logado
exports.index = async (req, res) => {
    try {
        // Verificar se usuário está logado
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para acessar seus produtos');
            return res.redirect('/login/index');
        }

        const usuarioId = req.session.user.id;

        // Buscar produtos do banco de dados
        const produtos = await db.all(
            `SELECT * FROM products WHERE usuario_id = ? ORDER BY id DESC`,
            [usuarioId]
        );

        // Processar produtos para adicionar imagemUrl e outras propriedades
        const produtosProcessados = produtos.map(produto => ({
            ...produto,
            imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
            precoFormatado: Number(produto.price).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            })
        }));

        // Flash messages para feedback
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

// Listar produtos de um usuário específico (para perfil público)
exports.listarPorUsuarioId = async (req, res) => {
    try {
        const usuarioId = req.params.id;

        // Buscar produtos do banco de dados com informações do vendedor
        const produtos = await db.all(
            `SELECT p.*, u.email as usuario_email, u.avatar as usuario_avatar
             FROM products p 
             JOIN usuarios u ON p.usuario_id = u.id 
             WHERE p.usuario_id = ? 
             ORDER BY p.id DESC`,
            [usuarioId]
        );

        // Processar produtos para adicionar imagemUrl
        const produtosProcessados = produtos.map(produto => ({
            ...produto,
            imagemUrl: produto.imagem ? `/uploads/produtos/${produto.imagem.split('/').pop()}` : null,
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