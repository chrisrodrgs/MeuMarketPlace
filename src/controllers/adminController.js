const db = require('../database/connection');

// Dashboard do admin
exports.dashboard = async (req, res) => {
    console.log('\n=== ADMIN DASHBOARD ===');
    
    try {
        // Verificar se é admin
        if (!req.session.user || !req.session.user.isAdmin) {
            console.log('❌ Acesso negado - não é admin');
            req.flash('errors', 'Acesso negado. Área restrita para administradores.');
            return res.redirect('/');
        }

        console.log('✅ Admin logado:', req.session.user.email);

        // Estatísticas
        const totalUsuarios = await db.get('SELECT COUNT(*) as total FROM usuarios');
        console.log('Total usuários:', totalUsuarios);

        const totalProdutos = await db.get('SELECT COUNT(*) as total FROM products');
        console.log('Total produtos:', totalProdutos);

        const totalAdmins = await db.get('SELECT COUNT(*) as total FROM usuarios WHERE isAdmin = 1');
        console.log('Total admins:', totalAdmins);

        // Últimos usuários cadastrados
        const ultimosUsuarios = await db.all(
            'SELECT id, email, isAdmin, data_criacao FROM usuarios ORDER BY data_criacao DESC LIMIT 5'
        );
        console.log('Últimos usuários:', ultimosUsuarios.length);

        res.render('admin/dashboard', {
            totalUsuarios: totalUsuarios.total,
            totalProdutos: totalProdutos.total,
            totalAdmins: totalAdmins.total,
            ultimosUsuarios: ultimosUsuarios,
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('❌ Erro no dashboard admin:', error);
        req.flash('errors', 'Erro ao carregar painel');
        res.redirect('/');
    }
};

// Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
    console.log('\n=== ADMIN LISTAR USUÁRIOS ===');
    
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            console.log('❌ Acesso negado - não é admin');
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        console.log('✅ Admin logado, buscando usuários...');

        const usuarios = await db.all(`
            SELECT u.*, 
                   (SELECT COUNT(*) FROM products WHERE usuario_id = u.id) as total_produtos 
            FROM usuarios u 
            ORDER BY u.data_criacao DESC
        `);

        console.log(`✅ ${usuarios.length} usuários encontrados`);

        res.render('admin/usuarios', {
            usuarios: usuarios,
            session: req.session, // Passar a sessão para a view
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        req.flash('errors', 'Erro ao carregar usuários');
        res.redirect('/admin');
    }
};

// Deletar usuário (apenas admin)
exports.deletarUsuario = async (req, res) => {
    console.log('\n=== ADMIN DELETAR USUÁRIO ===');
    
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            console.log('❌ Acesso negado');
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;
        console.log('Deletando usuário ID:', usuarioId);

        // Impedir admin de deletar a si mesmo
        if (usuarioId == req.session.user.id) {
            console.log('❌ Tentativa de deletar próprio usuário');
            req.flash('errors', 'Você não pode deletar sua própria conta');
            return res.redirect('/admin/usuarios');
        }

        // Verificar se usuário existe
        const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
        
        if (!usuario) {
            console.log('❌ Usuário não encontrado');
            req.flash('errors', 'Usuário não encontrado');
            return res.redirect('/admin/usuarios');
        }

        // Deletar usuário
        await db.run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

        console.log('✅ Usuário deletado:', usuario.email);
        req.flash('success', `Usuário ${usuario.email} deletado com sucesso!`);
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        req.flash('errors', 'Erro ao deletar usuário');
        res.redirect('/admin/usuarios');
    }
};

// Tornar usuário admin
exports.tornarAdmin = async (req, res) => {
    console.log('\n=== ADMIN TORNAR ADMIN ===');
    
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;
        console.log('Tornando admin usuário ID:', usuarioId);

        await db.run(
            'UPDATE usuarios SET isAdmin = 1 WHERE id = ?',
            [usuarioId]
        );

        console.log('✅ Usuário promovido a admin');
        req.flash('success', 'Usuário promovido a admin com sucesso!');
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        req.flash('errors', 'Erro ao promover usuário');
        res.redirect('/admin/usuarios');
    }
};

// Remover status de admin
exports.removerAdmin = async (req, res) => {
    console.log('\n=== ADMIN REMOVER ADMIN ===');
    
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        const usuarioId = req.params.id;
        console.log('Removendo admin do usuário ID:', usuarioId);

        // Impedir admin de remover o próprio status
        if (usuarioId == req.session.user.id) {
            console.log('❌ Tentativa de remover próprio admin');
            req.flash('errors', 'Você não pode remover seu próprio status de admin');
            return res.redirect('/admin/usuarios');
        }

        await db.run(
            'UPDATE usuarios SET isAdmin = 0 WHERE id = ?',
            [usuarioId]
        );

        console.log('✅ Status de admin removido');
        req.flash('success', 'Status de admin removido com sucesso!');
        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error('❌ Erro ao remover admin:', error);
        req.flash('errors', 'Erro ao remover status de admin');
        res.redirect('/admin/usuarios');
    }
};