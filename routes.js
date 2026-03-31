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
const promocaoController = require('./src/controllers/promocaoController');
const produtoController = require('./src/controllers/produtoController');
const produtoListController = require('./src/controllers/produtoListController');
const produtoAdcController = require('./src/controllers/produtoAdcController');
const produtoDeleteController = require('./src/controllers/produtoDeleteController');

// ========== ROTAS HOME ==========
router.get('/', homeController.index);

// ========== ROTAS LOGIN ==========
router.get('/login/index', loginController.index);
router.get('/login/logout', loginController.logout);
router.post('/login/login', loginController.login);
router.post('/login/register', loginController.register);

// ========== ROTA EM BREVE ==========
router.get('/em-breve', (req, res) => {
    res.render('em-breve');
});

// ========== ROTAS PERFIL ==========
router.get('/usuario/perfil', perfilController.index);

// Rotas Avatar
router.post('/usuario/perfil/avatar', 
    perfilController.uploadAvatar,
    perfilController.salvarAvatar
);
router.post('/usuario/perfil/avatar/remover', perfilController.removerAvatar);

// ========== ROTAS BUSCA ==========
router.get('/busca', searchController.index);
router.get('/busca/rapida', searchController.quickSearch);

// ========== ROTAS CATEGORIAS ==========
router.get('/categorias', categoriaController.listarTodos);
router.get('/categoria/:categoria', categoriaController.index);

// ========== ROTAS AVALIAÇÕES ==========
router.get('/produto/:produtoId', avaliacaoController.paginaProduto);
router.post('/produto/:produtoId/avaliar', avaliacaoController.avaliar);
router.get('/avaliacao/:avaliacaoId/deletar', avaliacaoController.deletar);
router.get('/api/produto/:produtoId/avaliacoes', avaliacaoController.getAvaliacoes);

// ========== ROTAS CARRINHO ==========
router.get('/carrinho', carrinhoController.verCarrinho);
router.post('/carrinho/adicionar', carrinhoController.adicionar);
router.put('/carrinho/item/:itemId', carrinhoController.atualizarQuantidade);
router.delete('/carrinho/item/:itemId', carrinhoController.remover);
router.post('/carrinho/limpar', carrinhoController.limpar);
router.get('/carrinho/contagem', carrinhoController.getContagemItens);

// ========== ROTAS ADMIN ==========
// Dashboard
router.get('/admin', adminController.dashboard);

// Usuários
router.get('/admin/usuarios', adminController.listarUsuarios);
router.get('/admin/usuarios/:id', adminController.verUsuario);
router.get('/admin/usuarios/:id/deletar', adminController.deletarUsuario);
router.get('/admin/usuarios/:id/tornar-admin', adminController.tornarAdmin);
router.get('/admin/usuarios/:id/remover-admin', adminController.removerAdmin);

// Produtos
router.get('/admin/produtos', adminController.listarProdutos);
router.get('/admin/produtos/:id', adminController.verProduto);
router.get('/admin/produtos/:id/deletar', adminController.deletarProduto);

// Avaliações
router.get('/admin/avaliacoes', adminController.listarTodasAvaliacoes);
router.get('/admin/avaliacao/:id/deletar', adminController.deletarAvaliacao);

// Chat
router.get('/admin/chat', adminChatController.index);

// Analytics
router.get('/admin/analytics', adminAnalyticsController.dashboard);
router.get('/admin/analytics/exportar', adminAnalyticsController.exportarRelatorio);
router.get('/api/analytics/dados', adminAnalyticsController.apiDados);

// ========== ROTAS PROMOÇÕES E CUPONS ==========
router.get('/admin/cupons', promocaoController.listarCupons);
router.post('/admin/cupons/criar', promocaoController.criarCupom);
router.post('/admin/cupons/:id/editar', promocaoController.editarCupom);
router.get('/admin/cupons/:id/deletar', promocaoController.deletarCupom);

// Banners
router.get('/admin/banners', promocaoController.listarBanners);
router.post('/admin/banners/criar', require('multer')(require('./src/config/multerBannerConfig')).single('imagem'), promocaoController.criarBanner);
router.post('/admin/banners/:id/editar', require('multer')(require('./src/config/multerBannerConfig')).single('imagem'), promocaoController.editarBanner);
router.get('/admin/banners/:id/deletar', promocaoController.deletarBanner);

// Promoções em Produtos
router.get('/admin/promocoes-produtos', promocaoController.listarPromocoesProdutos);
router.post('/admin/produtos/:id/promocao', promocaoController.aplicarPromocao);
router.get('/admin/produtos/:id/remover-promocao', promocaoController.removerPromocao);

// API Cupom
router.post('/api/validar-cupom', promocaoController.validarCupom);

// ========== ROTAS PRODUTOS (USUÁRIO) ==========
// Listar produtos do usuário logado
router.get('/meus-produtos', produtoListController.index);

// Adicionar produto
router.get('/produtos/adicionar', produtoAdcController.renderAddForm);
router.post('/produtos/adicionar', 
    produtoAdcController.uploadImagem,
    produtoAdcController.addProduto
);

// Editar produto
router.get('/produtos/editar/:id', produtoController.renderEditForm);
router.post('/produtos/editar/:id', 
    produtoController.uploadImagem,
    produtoController.updateProduto
);

// Deletar produto
router.get('/produtos/deletar/:id', produtoDeleteController.confirmDelete);
router.post('/produtos/deletar/:id', produtoDeleteController.deleteProduto);

// Listar produtos de um usuário específico (perfil público)
router.get('/usuario/:id/produtos', produtoListController.listarPorUsuarioId);

module.exports = router;