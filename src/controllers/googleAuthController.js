const passport = require('passport');

// Iniciar autenticação Google
exports.login = passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
});

// Callback após autenticação
exports.callback = passport.authenticate('google', {
    successRedirect: '/login/index',
    failureRedirect: '/login/index',
    failureFlash: true
});

// Callback com tratamento personalizado (opcional - para mais controle)
exports.callbackCustom = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            console.error('Erro na autenticação:', err);
            req.flash('errors', 'Erro ao autenticar com Google');
            return res.redirect('/login/index');
        }
        
        if (!user) {
            req.flash('errors', 'Não foi possível autenticar com Google');
            return res.redirect('/login/index');
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error('Erro no login:', err);
                req.flash('errors', 'Erro ao fazer login');
                return res.redirect('/login/index');
            }
            
            req.flash('success', 'Login com Google realizado com sucesso!');
            return res.redirect('/login/index');
        });
    })(req, res, next);
};