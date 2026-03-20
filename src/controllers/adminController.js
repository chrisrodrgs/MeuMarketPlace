const db = require('../database/connection');

// Dashboard do admin
exports.dashboard = async (req, res) => {
    try {
        // Verificar se é admin
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado. Área restrita para administradores.');
            return res.redirect('/');
        }

        // Estatísticas
        const totalUsuarios = await db.get('SELECT COUNT(*) as total FROM usuarios');
        const totalProdutos = await db.get('SELECT COUNT(*) as total FROM products');
        const totalAdmins = await db.get('SELECT COUNT(*) as total FROM usuarios WHERE isAdmin = 1');
        
        // Total de avaliações
        const totalAvaliacoes = await db.get('SELECT COUNT(*) as total FROM avaliacoes');
        
        // Média de avaliações
        const mediaAvaliacoes = await db.get('SELECT AVG(nota) as media FROM avaliacoes');

        // Últimos usuários cadastrados
        const ultimosUsuarios = await db.all(
            'SELECT id, email, isAdmin, avatar, data_criacao FROM usuarios ORDER BY data_criacao DESC LIMIT 5'
        );

        // Últimos produtos cadastrados
        const ultimosProdutos = await db.all(`
            SELECT p.*, u.email as vendedor_email 
            FROM products p 
            JOIN usuarios u ON p.usuario_id = u.id 
            ORDER BY p.data_criacao DESC 
            LIMIT 5
        `);

        // Produtos mais vendidos/avaliados
        const produtosMaisAvaliados = await db.all(`
            SELECT p.id, p.name, p.price, COUNT(a.id) as total_avaliacoes, AVG(a.nota) as media_avaliacoes
            FROM products p
            LEFT JOIN avaliacoes a ON p.id = a.produto_id
            GROUP BY p.id
            HAVING total_avaliacoes > 0
            ORDER BY total_avaliacoes DESC, media_avaliacoes DESC
            LIMIT 5
        `);

        res.render('admin/dashboard', {
            totalUsuarios: totalUsuarios.total,
            totalProdutos: totalProdutos.total,
            totalAdmins: totalAdmins.total,
            totalAvaliacoes: totalAvaliacoes.total,
            mediaAvaliacoes: mediaAvaliacoes.media ? mediaAvaliacoes.media.toFixed(1) : 0,
            ultimosUsuarios: ultimosUsuarios,
            ultimosProdutos: ultimosProdutos,
            produtosMaisAvaliados: produtosMaisAvaliados,
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Erro no dashboard admin:', error);
        req.flash('errors', 'Erro ao carregar painel');
        res.redirect('/');
    }
};

// Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        console.log('📋 Carregando lista de usuários para admin:', req.session.user.email);

        const usuarios = await db.all(`
            SELECT u.*, 
                   (SELECT COUNT(*) FROM products WHERE usuario_id = u.id) as total_produtos,
                   (SELECT COUNT(*) FROM avaliacoes a JOIN products p ON a.produto_id = p.id WHERE p.usuario_id = u.id) as total_avaliacoes_recebidas,
                   (SELECT AVG(nota) FROM avaliacoes a JOIN products p ON a.produto_id = p.id WHERE p.usuario_id = u.id) as media_avaliacoes
            FROM usuarios u 
            ORDER BY u.data_criacao DESC
        `);

        console.log(`✅ ${usuarios.length} usuários encontrados`);

        // PASSANDO A SESSÃO COMPLETA PARA A VIEW
        res.render('admin/usuarios', {
            usuarios: usuarios,
            session: req.session, // <--- IMPORTANTE: passando a sessão
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        req.flash('errors', 'Erro ao carregar usuários');
        res.redirect('/admin');
    }
};

// Ver detalhes de um usuário específico
exports.verUsuario = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;

        // Informações do usuário
        const usuario = await db.get(`
            SELECT u.*, 
                   (SELECT COUNT(*) FROM products WHERE usuario_id = u.id) as total_produtos,
                   (SELECT COUNT(*) FROM avaliacoes a JOIN products p ON a.produto_id = p.id WHERE p.usuario_id = u.id) as total_avaliacoes_recebidas,
                   (SELECT AVG(nota) FROM avaliacoes a JOIN products p ON a.produto_id = p.id WHERE p.usuario_id = u.id) as media_avaliacoes
            FROM usuarios u 
            WHERE u.id = ?
        `, [usuarioId]);

        if (!usuario) {
            req.flash('errors', 'Usuário não encontrado');
            return res.redirect('/admin/usuarios');
        }

        // Produtos do usuário
        const produtos = await db.all(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM avaliacoes WHERE produto_id = p.id) as total_avaliacoes,
                   (SELECT AVG(nota) FROM avaliacoes WHERE produto_id = p.id) as media_avaliacoes
            FROM products p
            WHERE p.usuario_id = ?
            ORDER BY p.data_criacao DESC
        `, [usuarioId]);

        // Avaliações recebidas (dos produtos do usuário)
        const avaliacoesRecebidas = await db.all(`
            SELECT a.*, p.name as produto_nome, u2.email as avaliador_email
            FROM avaliacoes a
            JOIN products p ON a.produto_id = p.id
            JOIN usuarios u2 ON a.usuario_id = u2.id
            WHERE p.usuario_id = ?
            ORDER BY a.data_avaliacao DESC
            LIMIT 20
        `, [usuarioId]);

        res.render('admin/usuario-detalhes', {
            usuario: usuario,
            produtos: produtos,
            avaliacoes: avaliacoesRecebidas,
            session: req.session, // <--- IMPORTANTE
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Erro ao ver usuário:', error);
        req.flash('errors', 'Erro ao carregar detalhes do usuário');
        res.redirect('/admin/usuarios');
    }
};

// Deletar usuário (apenas admin)
exports.deletarUsuario = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;

        // Impedir admin de deletar a si mesmo
        if (usuarioId == req.session.user.id) {
            req.flash('errors', 'Você não pode deletar sua própria conta');
            return res.redirect('/admin/usuarios');
        }

        // Verificar se usuário existe
        const usuario = await db.get('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
        
        if (!usuario) {
            req.flash('errors', 'Usuário não encontrado');
            return res.redirect('/admin/usuarios');
        }

        // Deletar usuário (produtos serão deletados automaticamente pelo ON DELETE CASCADE)
        await db.run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

        req.flash('success', `Usuário ${usuario.email} deletado com sucesso!`);
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        req.flash('errors', 'Erro ao deletar usuário');
        res.redirect('/admin/usuarios');
    }
};

// Tornar usuário admin
exports.tornarAdmin = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;

        const usuario = await db.get('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
        
        if (!usuario) {
            req.flash('errors', 'Usuário não encontrado');
            return res.redirect('/admin/usuarios');
        }

        await db.run(
            'UPDATE usuarios SET isAdmin = 1 WHERE id = ?',
            [usuarioId]
        );

        req.flash('success', `${usuario.email} promovido a admin com sucesso!`);
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('Erro ao promover usuário:', error);
        req.flash('errors', 'Erro ao promover usuário');
        res.redirect('/admin/usuarios');
    }
};

// Remover status de admin
exports.removerAdmin = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;

        // Impedir admin de remover o próprio status
        if (usuarioId == req.session.user.id) {
            req.flash('errors', 'Você não pode remover seu próprio status de admin');
            return res.redirect('/admin/usuarios');
        }

        const usuario = await db.get('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
        
        if (!usuario) {
            req.flash('errors', 'Usuário não encontrado');
            return res.redirect('/admin/usuarios');
        }

        await db.run(
            'UPDATE usuarios SET isAdmin = 0 WHERE id = ?',
            [usuarioId]
        );

        req.flash('success', `Status de admin removido de ${usuario.email}`);
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('Erro ao remover admin:', error);
        req.flash('errors', 'Erro ao remover status de admin');
        res.redirect('/admin/usuarios');
    }
};

// Listar todos os produtos (admin)
exports.listarProdutos = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const { page = 1, search = '', categoria = '' } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, u.email as vendedor_email,
                   (SELECT COUNT(*) FROM avaliacoes WHERE produto_id = p.id) as total_avaliacoes,
                   (SELECT AVG(nota) FROM avaliacoes WHERE produto_id = p.id) as media_avaliacoes
            FROM products p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE 1=1
        `;
        let countQuery = `SELECT COUNT(*) as total FROM products WHERE 1=1`;
        let params = [];
        let countParams = [];

        if (search) {
            query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (categoria) {
            query += ` AND p.categoria = ?`;
            countQuery += ` AND categoria = ?`;
            params.push(categoria);
            countParams.push(categoria);
        }

        query += ` ORDER BY p.data_criacao DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const produtos = await db.all(query, params);
        const totalResult = await db.get(countQuery, countParams);
        const totalPaginas = Math.ceil(totalResult.total / limit);

        // Buscar categorias para o filtro
        const categorias = await db.all(`
            SELECT DISTINCT categoria, COUNT(*) as total 
            FROM products 
            WHERE categoria IS NOT NULL 
            GROUP BY categoria 
            ORDER BY categoria
        `);

        res.render('admin/produtos', {
            produtos: produtos,
            categorias: categorias,
            total: totalResult.total,
            paginaAtual: parseInt(page),
            totalPaginas: totalPaginas,
            search: search,
            categoriaFiltro: categoria,
            session: req.session, // <--- IMPORTANTE
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Erro ao listar produtos (admin):', error);
        req.flash('errors', 'Erro ao carregar produtos');
        res.redirect('/admin');
    }
};

// Ver detalhes de um produto (admin)
exports.verProduto = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const produtoId = req.params.id;

        const produto = await db.get(`
            SELECT p.*, u.email as vendedor_email, u.id as vendedor_id
            FROM products p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?
        `, [produtoId]);

        if (!produto) {
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/admin/produtos');
        }

        // Avaliações do produto
        const avaliacoes = await db.all(`
            SELECT a.*, u.email as avaliador_email
            FROM avaliacoes a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.produto_id = ?
            ORDER BY a.data_avaliacao DESC
        `, [produtoId]);

        res.render('admin/produto-detalhes', {
            produto: produto,
            avaliacoes: avaliacoes,
            session: req.session, // <--- IMPORTANTE
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Erro ao ver produto:', error);
        req.flash('errors', 'Erro ao carregar produto');
        res.redirect('/admin/produtos');
    }
};

// Deletar produto (admin)
exports.deletarProduto = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const produtoId = req.params.id;

        const produto = await db.get('SELECT name FROM products WHERE id = ?', [produtoId]);
        
        if (!produto) {
            req.flash('errors', 'Produto não encontrado');
            return res.redirect('/admin/produtos');
        }

        await db.run('DELETE FROM products WHERE id = ?', [produtoId]);

        req.flash('success', `Produto "${produto.name}" deletado com sucesso!`);
        
        // Se veio da página de detalhes do usuário, volta para lá
        if (req.query.redirect) {
            return res.redirect(req.query.redirect);
        }
        
        res.redirect('/admin/produtos');

    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        req.flash('errors', 'Erro ao deletar produto');
        res.redirect('/admin/produtos');
    }
};

// Deletar avaliação (admin)
exports.deletarAvaliacao = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const avaliacaoId = req.params.id;

        const avaliacao = await db.get('SELECT id FROM avaliacoes WHERE id = ?', [avaliacaoId]);
        
        if (!avaliacao) {
            req.flash('errors', 'Avaliação não encontrada');
            return res.redirect('back');
        }

        await db.run('DELETE FROM avaliacoes WHERE id = ?', [avaliacaoId]);

        req.flash('success', 'Avaliação deletada com sucesso!');
        res.redirect('back');

    } catch (error) {
        console.error('Erro ao deletar avaliação:', error);
        req.flash('errors', 'Erro ao deletar avaliação');
        res.redirect('back');
    }
};