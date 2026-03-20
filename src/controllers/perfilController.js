const db = require('../database/connection');
const multer = require('multer');
const multerConfig = require('../config/multerAvatarConfig');
const upload = multer(multerConfig).single('avatar');
const fs = require('fs');
const path = require('path');

// Página do perfil
exports.index = async (req, res) => {
    console.log('\n=== 🔍 DEBUG PERFIL ===');
    console.log('1️⃣ Função index EXECUTADA!');
    console.log('2️⃣ Usuário na sessão:', req.session.user);
    
    try {
        // Verificar se usuário está logado
        if (!req.session.user) {
            console.log('❌ Usuário NÃO está logado!');
            return res.redirect('/login/index');
        }

        console.log('✅ Usuário está logado! ID:', req.session.user.id);

        // Buscar usuário no banco de dados
        console.log('Buscando usuário no banco com ID:', req.session.user.id);
        
        let usuario = await db.get(
            'SELECT id, email, avatar FROM usuarios WHERE id = ?',
            [req.session.user.id]
        );

        // SE NÃO ENCONTRAR NO BANCO, USA DADOS DA SESSÃO
        if (!usuario) {
            console.log('⚠️ Usuário não encontrado no banco! Usando dados da sessão...');
            usuario = {
                id: req.session.user.id,
                email: req.session.user.email,
                avatar: req.session.user.avatar || null
            };
        }

        console.log('Usuário usado:', usuario);

        // Buscar produtos do usuário
        console.log('Buscando produtos...');
        
        let produtos = [];
        try {
            produtos = await db.all(
                'SELECT * FROM products WHERE usuario_id = ? ORDER BY id DESC LIMIT 3',
                [req.session.user.id]
            );
        } catch (error) {
            console.log('Erro ao buscar produtos, continuando com array vazio');
            produtos = [];
        }

        console.log(`Produtos encontrados: ${produtos.length}`);

        res.render('perfilView', { 
            usuario: usuario,
            produtos: produtos || [],
            errors: req.flash('errors'),
            success: req.flash('success')
        });

    } catch (error) {
        console.error('❌ ERRO no perfil:', error);
        req.flash('errors', 'Erro ao carregar perfil');
        res.redirect('/');
    }
};

// Upload de avatar
exports.uploadAvatar = (req, res, next) => {
    console.log('\n=== 📤 UPLOAD AVATAR ===');
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('❌ Erro Multer:', err);
            req.flash('errors', `Erro no upload: ${err.message}`);
            return res.redirect('/usuario/perfil');
        } else if (err) {
            console.error('❌ Erro geral:', err);
            req.flash('errors', err.message);
            return res.redirect('/usuario/perfil');
        }
        console.log('✅ Upload OK, arquivo:', req.file ? req.file.filename : 'nenhum');
        next();
    });
};

// Salvar avatar no banco
exports.salvarAvatar = async (req, res) => {
    console.log('\n=== 💾 SALVAR AVATAR ===');
    try {
        if (!req.session.user) {
            console.log('❌ Usuário não logado');
            return res.redirect('/login/index');
        }

        if (!req.file) {
            console.log('❌ Nenhum arquivo');
            req.flash('errors', 'Nenhuma imagem selecionada');
            return res.redirect('/usuario/perfil');
        }

        console.log('Arquivo:', req.file.filename);
        console.log('Usuário ID:', req.session.user.id);

        // Verificar se usuário existe no banco
        const usuarioExistente = await db.get(
            'SELECT id FROM usuarios WHERE id = ?',
            [req.session.user.id]
        );

        // Se não existir, não tenta atualizar avatar
        if (!usuarioExistente) {
            console.log('⚠️ Usuário não existe no banco, não é possível salvar avatar');
            req.flash('errors', 'Usuário não encontrado no banco de dados');
            return res.redirect('/usuario/perfil');
        }

        // Buscar avatar antigo
        const usuario = await db.get(
            'SELECT avatar FROM usuarios WHERE id = ?',
            [req.session.user.id]
        );

        // Deletar avatar antigo
        if (usuario && usuario.avatar) {
            const oldAvatarPath = path.join(__dirname, '..', '..', 'public', usuario.avatar);
            console.log('Deletando avatar antigo:', oldAvatarPath);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        const avatarPath = `uploads/avatars/${req.file.filename}`;
        console.log('Novo caminho:', avatarPath);

        await db.run(
            'UPDATE usuarios SET avatar = ? WHERE id = ?',
            [avatarPath, req.session.user.id]
        );

        req.session.user.avatar = avatarPath;

        req.flash('success', 'Foto de perfil atualizada!');
        res.redirect('/usuario/perfil');

    } catch (error) {
        console.error('❌ Erro:', error);
        req.flash('errors', 'Erro ao salvar foto');
        res.redirect('/usuario/perfil');
    }
};

// Remover avatar
exports.removerAvatar = async (req, res) => {
    console.log('\n=== 🗑️ REMOVER AVATAR ===');
    try {
        if (!req.session.user) {
            return res.redirect('/login/index');
        }

        const usuario = await db.get(
            'SELECT avatar FROM usuarios WHERE id = ?',
            [req.session.user.id]
        );

        if (usuario && usuario.avatar) {
            const avatarPath = path.join(__dirname, '..', '..', 'public', usuario.avatar);
            console.log('Deletando arquivo:', avatarPath);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }

        await db.run(
            'UPDATE usuarios SET avatar = NULL WHERE id = ?',
            [req.session.user.id]
        );

        delete req.session.user.avatar;

        req.flash('success', 'Foto removida!');
        res.redirect('/usuario/perfil');

    } catch (error) {
        console.error('❌ Erro:', error);
        req.flash('errors', 'Erro ao remover foto');
        res.redirect('/usuario/perfil');
    }
};