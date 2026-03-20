const db = require('../database/connection');

exports.index = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            req.flash('errors', 'Acesso negado');
            return res.redirect('/');
        }

        // Buscar todos os usuários com suas últimas mensagens
        const usuarios = await db.all(`
            SELECT u.id, u.email, u.avatar,
                   (SELECT COUNT(*) FROM messages 
                    WHERE conversation_id = 'user-' || u.id 
                    AND read = 0 AND sender_id != ?) as unread_count,
                   (SELECT message FROM messages 
                    WHERE conversation_id = 'user-' || u.id 
                    ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages 
                    WHERE conversation_id = 'user-' || u.id 
                    ORDER BY created_at DESC LIMIT 1) as last_message_date
            FROM usuarios u
            WHERE u.id != ?
            ORDER BY last_message_date DESC
        `, [req.session.user.id, req.session.user.id]);

        res.render('admin/chat', {
            usuarios: usuarios,
            user: req.session.user,
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('Erro ao carregar chat admin:', error);
        req.flash('errors', 'Erro ao carregar chat');
        res.redirect('/admin');
    }
};