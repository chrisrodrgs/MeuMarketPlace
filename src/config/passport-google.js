const passport = require('passport');
const GoogleStrategy = require('passport-google-oidc');
const db = require('../database/connection'); // <--- CORRIGIDO (removeu um ponto)
require('dotenv').config();

module.exports = function() {
    console.log('🔧 Configurando autenticação com Google...');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Presente' : '❌ Ausente');
    
    try {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/oauth2/redirect/google',
            scope: ['profile', 'email']
        }, async function verify(issuer, profile, cb) {
            try {
                console.log('📧 Perfil Google recebido:', profile.emails?.[0]?.value);
                
                const cred = await db.get(
                    'SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?',
                    [issuer, profile.id]
                );

                if (!cred) {
                    const email = profile.emails?.[0]?.value || `${profile.id}@google.user`;
                    const avatar = profile.photos?.[0]?.value || null;
                    
                    console.log('🆕 Criando novo usuário:', email);
                    
                    const result = await db.run(
                        'INSERT INTO usuarios (email, password, avatar) VALUES (?, ?, ?)',
                        [email, 'GOOGLE_AUTH', avatar]
                    );

                    const userId = result.id;

                    await db.run(
                        'INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)',
                        [userId, issuer, profile.id]
                    );

                    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [userId]);
                    return cb(null, user);
                } else {
                    console.log('✅ Usuário já existe:', cred.user_id);
                    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [cred.user_id]);
                    return cb(null, user);
                }
            } catch (err) {
                console.error('❌ Erro na autenticação Google:', err);
                return cb(err);
            }
        }));

        passport.serializeUser(function(user, cb) {
            process.nextTick(function() {
                cb(null, { 
                    id: user.id, 
                    email: user.email,
                    avatar: user.avatar,
                    isAdmin: user.isAdmin || 0
                });
            });
        });

        passport.deserializeUser(function(user, cb) {
            process.nextTick(function() {
                return cb(null, user);
            });
        });
        
        console.log('✅ Autenticação Google configurada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao configurar estratégia Google:', error);
    }
};