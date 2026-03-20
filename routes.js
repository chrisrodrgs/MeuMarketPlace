const express = require('express');
const router = express.Router();

const homeController = require('./src/controllers/homeController');
const loginController = require('./src/controllers/loginController');
const perfilController = require('./src/controllers/perfilController');
const adminController = require('./src/controllers/adminController');
const adminChatController = require('./src/controllers/adminChatController');
const adminAnalyticsController = require('./src/controllers/adminAnalyticsController');
const searchController = require('./src/controllers/searchController');
const categoriaController = require('./src/controllers/categoriaController');
const avaliacaoController = require('./src/controllers/avaliacaoController');
const carrinhoController = require('./src/controllers/carrinhoController');
const googleAuthController = require('./src/controllers/googleAuthController'); // DESCOMENTADO
const produtoController = require('./src/controllers/produtoController');
const produtoListController = require('./src/controllers/produtoListController');
const produtoAdcController = require('./src/controllers/produtoAdcController');
const produtoDeleteController = require('./src/controllers/produtoDeleteController');

//Rotas Home
router.get('/', homeController.index);

//Rotas Login Usuário
router.get('/login/index', loginController.index);
router.get('/login/logout', loginController.logout);
router.post('/login/login', loginController.login);
router.post('/login/register', loginController.register);

// ===== ROTAS GOOGLE AUTH =====
router.get('/login/google', googleAuthController.login);
router.get('/oauth2/redirect/google', googleAuthController.callback);

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

// NOVAS ROTAS DE CATEGORIAS
router.get('/categorias', categoriaController.listarTodos);
router.get('/categoria/:categoria', categoriaController.index);

// NOVAS ROTAS DE AVALIAÇÕES
router.get('/produto/:produtoId', avaliacaoController.paginaProduto);
router.post('/produto/:produtoId/avaliar', avaliacaoController.avaliar);
router.get('/avaliacao/:avaliacaoId/deletar', avaliacaoController.deletar);
router.get('/api/produto/:produtoId/avaliacoes', avaliacaoController.getAvaliacoes);

// NOVAS ROTAS DO CARRINHO
router.get('/carrinho', carrinhoController.verCarrinho);
router.post('/carrinho/adicionar', carrinhoController.adicionar);
router.put('/carrinho/item/:itemId', carrinhoController.atualizarQuantidade);
router.delete('/carrinho/item/:itemId', carrinhoController.remover);
router.post('/carrinho/limpar', carrinhoController.limpar);
router.get('/carrinho/contagem', carrinhoController.getContagemItens);

// NOVAS ROTAS DO ADMIN
router.get('/admin', adminController.dashboard);
router.get('/admin/usuarios', adminController.listarUsuarios);
router.get('/admin/usuarios/:id', adminController.verUsuario);
router.get('/admin/usuarios/:id/deletar', adminController.deletarUsuario);
router.get('/admin/usuarios/:id/tornar-admin', adminController.tornarAdmin);
router.get('/admin/usuarios/:id/remover-admin', adminController.removerAdmin);
router.get('/admin/produtos', adminController.listarProdutos);
router.get('/admin/produtos/:id', adminController.verProduto);
router.get('/admin/produtos/:id/deletar', adminController.deletarProduto);
router.get('/admin/avaliacao/:id/deletar', adminController.deletarAvaliacao);
router.get('/admin/chat', adminChatController.index);
router.get('/admin/analytics', adminAnalyticsController.dashboard);
router.get('/admin/analytics/exportar', adminAnalyticsController.exportarRelatorio);
router.get('/api/analytics/dados', adminAnalyticsController.apiDados);

// Rotas de Produtos
router.get('/meus-produtos', produtoListController.index);
router.get('/produtos/adicionar', produtoAdcController.renderAddForm);
router.post('/produtos/adicionar', 
    produtoAdcController.uploadImagem,
    produtoAdcController.addProduto
);
router.get('/produtos/editar/:id', produtoController.renderEditForm);
router.post('/produtos/editar/:id', produtoController.updateProduto);
router.get('/produtos/deletar/:id', produtoDeleteController.confirmDelete);
router.post('/produtos/deletar/:id', produtoDeleteController.deleteProduto);
router.get('/usuario/:id/produtos', produtoListController.listarPorUsuarioId);

module.exports = router;