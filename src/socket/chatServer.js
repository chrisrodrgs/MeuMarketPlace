const { Server } = require('socket.io');
const db = require('../database/connection');

class ChatServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.onlineUsers = new Map(); // { userId: socketId }
        this.userRooms = new Map(); // { userId: roomId }
        this.setupMiddleware();
        this.setupEvents();
    }

    setupMiddleware() {
        this.io.use(async (socket, next) => {
            const userId = socket.handshake.auth.userId;
            const userEmail = socket.handshake.auth.userEmail;
            const isAdmin = socket.handshake.auth.isAdmin;

            if (!userId || !userEmail) {
                return next(new Error('Autenticação necessária'));
            }

            socket.userId = parseInt(userId);
            socket.userEmail = userEmail;
            socket.userName = userEmail.split('@')[0];
            socket.isAdmin = isAdmin === 'true' || isAdmin === true || isAdmin === '1';

            console.log(`🔵 Cliente conectado: ${socket.userName} (${socket.isAdmin ? 'ADMIN' : 'Usuário'}) - ID: ${socket.userId}`);

            next();
        });
    }

    setupEvents() {
        this.io.on('connection', (socket) => {
            // Registrar usuário online
            this.onlineUsers.set(socket.userId, socket.id);
            
            if (socket.isAdmin) {
                socket.join('admins');
                console.log(`👑 Admin ${socket.userName} entrou na sala de admins`);
                
                // Enviar lista de usuários online para o admin
                this.enviarListaUsuarios(socket);
                
                // Admin pode entrar em salas de usuários específicas
                socket.on('join_user_room', (data) => {
                    // Sair da sala anterior se estiver em uma
                    const roomAnterior = this.userRooms.get(socket.userId);
                    if (roomAnterior) {
                        socket.leave(roomAnterior);
                        console.log(`👑 Admin ${socket.userName} saiu da sala ${roomAnterior}`);
                    }
                    
                    const userRoom = `user-${data.userId}`;
                    socket.join(userRoom);
                    this.userRooms.set(socket.userId, userRoom);
                    console.log(`👑 Admin ${socket.userName} entrou na sala do usuário ${data.userId}`);
                    
                    // Carregar histórico da conversa
                    this.carregarHistoricoConversa(socket, data.userId);
                });
                
                socket.on('leave_user_room', () => {
                    const room = this.userRooms.get(socket.userId);
                    if (room) {
                        socket.leave(room);
                        this.userRooms.delete(socket.userId);
                        console.log(`👑 Admin ${socket.userName} saiu da sala`);
                    }
                });
            } else {
                const userRoom = `user-${socket.userId}`;
                socket.join(userRoom);
                console.log(`👤 Usuário ${socket.userName} entrou na sala ${userRoom}`);
                
                // Notificar admins que usuário está online
                this.io.to('admins').emit('user_online', {
                    userId: socket.userId,
                    userName: socket.userName,
                    userEmail: socket.userEmail
                });
                
                // Carregar histórico do usuário
                this.carregarHistoricoUsuario(socket);
            }

            // Evento de nova mensagem
            socket.on('send_message', (data) => this.handleNewMessage(socket, data));

            // Evento de digitação
            socket.on('typing', (data) => this.handleTyping(socket, data));

            // Evento de desconexão
            socket.on('disconnect', () => this.handleDisconnect(socket));

            // Marcar mensagens como lidas
            socket.on('mark_read', (data) => this.handleMarkRead(socket, data));
        });
    }

    async enviarListaUsuarios(socket) {
        try {
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
            `, [socket.userId, socket.userId]);
            
            socket.emit('lista_usuarios', usuarios);
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
        }
    }

    async carregarHistoricoConversa(socket, usuarioId) {
        try {
            const messages = await db.all(`
                SELECT * FROM messages 
                WHERE conversation_id = ? OR (sender_id = ? AND is_admin = 1) OR (sender_id = ? AND is_admin = 0)
                ORDER BY created_at ASC
            `, [`user-${usuarioId}`, usuarioId, usuarioId]);
            
            socket.emit('historico_conversa', { userId: usuarioId, messages });
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    async carregarHistoricoUsuario(socket) {
        try {
            const messages = await db.all(`
                SELECT * FROM messages 
                WHERE conversation_id = ? OR sender_id = ?
                ORDER BY created_at ASC
            `, [`user-${socket.userId}`, socket.userId]);
            
            socket.emit('message_history', messages);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    async handleNewMessage(socket, data) {
        try {
            const { message, userId } = data;
            if (!message || message.trim() === '') return;

            console.log(`📨 Nova mensagem de ${socket.userName}: "${message.substring(0, 30)}..."`);

            let conversationId;
            let recipientId;

            if (socket.isAdmin) {
                recipientId = parseInt(userId);
                conversationId = `user-${recipientId}`;
                console.log(`   ➡️ Admin respondendo para usuário ${recipientId}`);
            } else {
                recipientId = 'admin';
                conversationId = `user-${socket.userId}`;
                console.log(`   ➡️ Usuário enviando para admin`);
            }

            // Salvar mensagem no banco
            const result = await db.run(
                `INSERT INTO messages (
                    sender_id, sender_email, sender_name, message, is_admin, conversation_id
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    socket.userId,
                    socket.userEmail,
                    socket.userName,
                    message,
                    socket.isAdmin ? 1 : 0,
                    conversationId
                ]
            );

            const savedMessage = await db.get(
                'SELECT * FROM messages WHERE id = ?',
                [result.id]
            );

            const messageData = {
                ...savedMessage,
                created_at: new Date(savedMessage.created_at).toISOString()
            };

            // Enviar para as salas apropriadas - CORRIGIDO PARA NÃO DUPLICAR
            if (socket.isAdmin) {
                // Admin: enviar APENAS para o usuário específico e para o próprio admin
                this.io.to(`user-${recipientId}`).emit('receive_message', messageData);
                // Enviar apenas para o admin que enviou a mensagem (não para todos)
                socket.emit('receive_message', messageData);
                
                // Atualizar lista de usuários para o admin
                this.enviarListaUsuarios(socket);
            } else {
                // Usuário: enviar para todos os admins e para o próprio usuário
                this.io.to('admins').emit('receive_message', messageData);
                // Enviar apenas para o usuário que enviou a mensagem
                socket.emit('receive_message', messageData);
                
                // Notificar admin sobre nova mensagem
                this.io.to('admins').emit('nova_mensagem_usuario', {
                    userId: socket.userId,
                    userName: socket.userName,
                    message: message
                });
            }

        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            socket.emit('error', 'Erro ao enviar mensagem');
        }
    }

    handleTyping(socket, data) {
        const { isTyping, userId } = data;

        if (socket.isAdmin) {
            if (userId) {
                this.io.to(`user-${userId}`).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.userName,
                    isTyping
                });
            }
        } else {
            this.io.to('admins').emit('user_typing', {
                userId: socket.userId,
                userName: socket.userName,
                isTyping
            });
        }
    }

    async handleMarkRead(socket, data) {
        try {
            const { messageIds } = data;
            if (messageIds && messageIds.length > 0) {
                await db.run(
                    `UPDATE messages SET read = 1 WHERE id IN (${messageIds.join(',')})`
                );
            }
        } catch (error) {
            console.error('❌ Erro ao marcar mensagens como lidas:', error);
        }
    }

    handleDisconnect(socket) {
        console.log(`🔴 Cliente desconectado: ${socket.userName}`);
        this.onlineUsers.delete(socket.userId);
        
        if (!socket.isAdmin) {
            this.io.to('admins').emit('user_offline', {
                userId: socket.userId,
                userName: socket.userName
            });
        }
    }
}

module.exports = ChatServer;