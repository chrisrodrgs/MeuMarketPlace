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
        this.setupMiddleware();
        this.setupEvents();
    }

    setupMiddleware() {
        // Middleware de autenticação
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
            
            // Entrar na sala apropriada
            if (socket.isAdmin) {
                socket.join('admins');
                console.log(`👑 Admin ${socket.userName} entrou na sala de admins`);
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
            }

            // Enviar histórico de mensagens
            this.sendMessageHistory(socket);

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

    async handleNewMessage(socket, data) {
        try {
            const { message, userId } = data;

            if (!message || message.trim() === '') return;

            console.log(`📨 Nova mensagem de ${socket.userName}: "${message.substring(0, 30)}..."`);

            let conversationId;
            let recipientId;

            if (socket.isAdmin) {
                // Admin respondendo para um usuário específico
                recipientId = parseInt(userId);
                conversationId = `user-${recipientId}`;
                console.log(`   ➡️ Admin respondendo para usuário ${recipientId}`);
            } else {
                // Usuário enviando para admin
                recipientId = 'admin';
                conversationId = 'admin';
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

            // Buscar mensagem salva
            const savedMessage = await db.get(
                'SELECT * FROM messages WHERE id = ?',
                [result.id]
            );

            // Formatar mensagem para envio
            const messageData = {
                ...savedMessage,
                created_at: new Date(savedMessage.created_at).toISOString()
            };

            // Emitir para as salas apropriadas
            if (socket.isAdmin) {
                // Admin: enviar para o usuário específico e para todos os admins
                this.io.to(`user-${recipientId}`).emit('receive_message', messageData);
                this.io.to('admins').emit('receive_message', messageData);
                console.log(`   ✅ Mensagem enviada para usuário ${recipientId} e admins`);
            } else {
                // Usuário: enviar para todos os admins
                this.io.to('admins').emit('receive_message', messageData);
                // Também enviar de volta para o próprio usuário (para aparecer na interface)
                socket.emit('receive_message', messageData);
                console.log(`   ✅ Mensagem enviada para admins`);
            }

        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            socket.emit('error', 'Erro ao enviar mensagem');
        }
    }

    async sendMessageHistory(socket) {
        try {
            let messages = [];

            if (socket.isAdmin) {
                // Admin vê todas as mensagens (últimas 100)
                messages = await db.all(`
                    SELECT * FROM messages 
                    ORDER BY created_at DESC 
                    LIMIT 100
                `);
                console.log(`📚 Admin carregou ${messages.length} mensagens do histórico`);
            } else {
                // Usuário vê mensagens da sua conversa
                messages = await db.all(`
                    SELECT * FROM messages 
                    WHERE conversation_id = ? OR sender_id = ?
                    ORDER BY created_at DESC 
                    LIMIT 50
                `, [`user-${socket.userId}`, socket.userId]);
                console.log(`👤 Usuário ${socket.userName} carregou ${messages.length} mensagens`);
            }

            // Inverter para ordem cronológica
            messages.reverse();

            socket.emit('message_history', messages);

        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
        }
    }

    handleTyping(socket, data) {
        const { isTyping, userId } = data;

        if (socket.isAdmin) {
            // Admin digitando - notificar usuário específico
            if (userId) {
                this.io.to(`user-${userId}`).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.userName,
                    isTyping
                });
            }
        } else {
            // Usuário digitando - notificar admins
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
            // Notificar admins que usuário ficou offline
            this.io.to('admins').emit('user_offline', {
                userId: socket.userId,
                userName: socket.userName
            });
        }
    }
}

module.exports = ChatServer;