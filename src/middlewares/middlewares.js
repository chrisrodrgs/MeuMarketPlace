module.exports.middlewareGlobal = (req, res, next) => {
    const errors = req.flash('errors');
    const success = req.flash('success');
    
    // Converte para null se estiver vazio
    res.locals.errors = (errors && errors.length > 0) ? errors : null;
    res.locals.success = (success && success.length > 0) ? success : null;
    res.locals.user = req.session.user;
    
    next();
};