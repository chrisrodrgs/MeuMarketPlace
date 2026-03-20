const express = require('express');
const router = express.Router();

const homeController = require('./src/controllers/homeController');
const loginController = require('./src/controllers/loginController');
const perfilController = require('./src/controllers/perfilController');
const adminController = require('./src/controllers/adminController');
const searchController = require('./src/controllers/searchController'); // NOVO
const produtoController = require('./src/controllers/produtoController');
const produtoListController = require('./src/controllers/produtoListController');
// NOVOS: Importando os controllers de adicionar e deletar produtos
const produtoAdcController = require('./src/controllers/produtoAdcController');
const produtoDeleteController = require('./src/controllers/produtoDeleteController');

//Rotas Home
router.get('/', homeController.index);

//Rotas Login Usuário
router.get('/login/index', loginController.index);
router.get('/login/logout', loginController.logout);
router.post('/login/login', loginController.login);
router.post('/login/register', loginController.register);

//Rotas Perfil Usuário
router.get('/usuario/perfil', perfilController.index);

// NOVAS ROTAS DE AVATAR
router.post('/usuario/perfil/avatar', 
    perfilController.uploadAvatar,
    perfilController.salvarAvatar
);
router.post('/usuario/perfil/avatar/remover', perfilController.removerAvatar);

// NOVAS ROTAS DE BUSCA
router.get('/busca', searchController.index);
router.get('/busca/rapida', searchController.quickSearch);
router.get('/categoria/:nome', searchController.categoria);

// NOVAS ROTAS DO ADMIN
router.get('/admin', adminController.dashboard);
router.get('/admin/usuarios', adminController.listarUsuarios);
router.get('/admin/usuarios/:id/deletar', adminController.deletarUsuario);
router.get('/admin/usuarios/:id/tornar-admin', adminController.tornarAdmin);
router.get('/admin/usuarios/:id/remover-admin', adminController.removerAdmin);

// Rotas de Produtos
router.get('/meus-produtos', produtoListController.index);
router.get('/produtos/adicionar', produtoAdcController.renderAddForm);
router.post('/produtos/adicionar', 
    produtoAdcController.uploadImagem,
    produtoAdcController.addProduto
);
router.get('/produtos/editar/:id', produtoController.renderEditForm);
router.post('/produtos/editar/:id', produtoController.updateProdutoTeste);
router.get('/produtos/deletar/:id', produtoDeleteController.confirmDelete);
router.post('/produtos/deletar/:id', produtoDeleteController.deleteProduto);
router.get('/usuario/:id/produtos', produtoListController.listarPorUsuarioId);

// NOVAS ROTAS DE CHAT
const chatController = require('./src/controllers/chatController');

router.get('/chat', chatController.index);
router.get('/chat/conversa/:userId', chatController.getConversation);

// ROTAS DE TESTE - HOME
router.get('/teste1', (req, res) => {
    res.render('home-teste1', { 
        user: req.session.user || null 
    });
});

router.get('/teste2', (req, res) => {
    res.render('home-teste2', { 
        user: req.session.user || null 
    });
});

router.get('/teste3', (req, res) => {
    res.render('home-teste3', { 
        user: req.session.user || null 
    });
});

module.exports = router;