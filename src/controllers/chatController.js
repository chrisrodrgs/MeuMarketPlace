const db = require('../database/connection');

exports.index = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login/index');
        }

        // Buscar usuários para o admin (apenas se for admin)
        let usuarios = [];
        if (req.session.user.isAdmin) {
            usuarios = await db.all(`
                SELECT id, email, avatar, isAdmin,
                       (SELECT COUNT(*) FROM messages WHERE sender_id = usuarios.id AND read = 0) as unread_count
                FROM usuarios 
                WHERE id != ?
                ORDER BY last_active DESC
            `, [req.session.user.id]);
        }

        res.render('chat/index', {
            user: req.session.user,
            usuarios: usuarios,
            isAdmin: req.session.user.isAdmin
        });

    } catch (error) {
        console.error('Erro ao carregar chat:', error);
        res.redirect('/');
    }
};

exports.getConversation = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const messages = await db.all(`
            SELECT * FROM messages 
            WHERE (sender_id = ? AND conversation_id = 'admin')
               OR (conversation_id = ?)
            ORDER BY created_at ASC
        `, [userId, `user-${userId}`]);

        res.json({ messages });

    } catch (error) {
        console.error('Erro ao buscar conversa:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
};