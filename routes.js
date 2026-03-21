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

// Rotas Home
router.get('/', homeController.index);

// Rotas Login Usuário
router.get('/login/index', loginController.index);
router.get('/login/logout', loginController.logout);
router.post('/login/login', loginController.login);
router.post('/login/register', loginController.register);

// Rota Em Breve
router.get('/em-breve', (req, res) => {
    res.render('em-breve');
});

// Rotas Perfil Usuário
router.get('/usuario/perfil', perfilController.index);

// Rotas Avatar
router.post('/usuario/perfil/avatar', 
    perfilController.uploadAvatar,
    perfilController.salvarAvatar
);
router.post('/usuario/perfil/avatar/remover', perfilController.removerAvatar);

// Rotas Busca
router.get('/busca', searchController.index);
router.get('/busca/rapida', searchController.quickSearch);

// Rotas Categorias
router.get('/categorias', categoriaController.listarTodos);
router.get('/categoria/:categoria', categoriaController.index);

// Rotas Avaliações
router.get('/produto/:produtoId', avaliacaoController.paginaProduto);
router.post('/produto/:produtoId/avaliar', avaliacaoController.avaliar);
router.get('/avaliacao/:avaliacaoId/deletar', avaliacaoController.deletar);
router.get('/api/produto/:produtoId/avaliacoes', avaliacaoController.getAvaliacoes);

// Rotas Carrinho
router.get('/carrinho', carrinhoController.verCarrinho);
router.post('/carrinho/adicionar', carrinhoController.adicionar);
router.put('/carrinho/item/:itemId', carrinhoController.atualizarQuantidade);
router.delete('/carrinho/item/:itemId', carrinhoController.remover);
router.post('/carrinho/limpar', carrinhoController.limpar);
router.get('/carrinho/contagem', carrinhoController.getContagemItens);

// ========== ROTAS ADMIN ==========
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

// ========== ROTAS DE PROMOÇÕES E CUPONS ==========
router.get('/admin/cupons', promocaoController.listarCupons);
router.post('/admin/cupons/criar', promocaoController.criarCupom);
router.post('/admin/cupons/:id/editar', promocaoController.editarCupom);
router.get('/admin/cupons/:id/deletar', promocaoController.deletarCupom);
router.get('/admin/banners', promocaoController.listarBanners);
router.post('/admin/banners/criar', require('multer')(require('./src/config/multerBannerConfig')).single('imagem'), promocaoController.criarBanner);
router.post('/admin/banners/:id/editar', require('multer')(require('./src/config/multerBannerConfig')).single('imagem'), promocaoController.editarBanner);
router.get('/admin/banners/:id/deletar', promocaoController.deletarBanner);
router.get('/admin/promocoes-produtos', promocaoController.listarPromocoesProdutos);
router.post('/admin/produtos/:id/promocao', promocaoController.aplicarPromocao);
router.get('/admin/produtos/:id/remover-promocao', promocaoController.removerPromocao);

// API para validar cupom
router.post('/api/validar-cupom', promocaoController.validarCupom);

// ========== ROTAS DE PRODUTOS ==========
// Listar produtos do usuário logado
router.get('/meus-produtos', produtoListController.index);

// Adicionar produto
router.get('/produtos/adicionar', produtoAdcController.renderAddForm);
router.post('/produtos/adicionar', 
    produtoAdcController.uploadImagem,
    produtoAdcController.addProduto
);

// Editar produto (com upload de imagem)
router.get('/produtos/editar/:id', produtoController.renderEditForm);
router.post('/produtos/editar/:id', 
    produtoController.uploadImagem,
    produtoController.updateProduto
);

// Deletar produto
router.get('/produtos/deletar/:id', produtoDeleteController.confirmDelete);
router.post('/produtos/deletar/:id', produtoDeleteController.deleteProduto);

// Rota para listar produtos de um usuário específico (para perfil público)
router.get('/usuario/:id/produtos', produtoListController.listarPorUsuarioId);

module.exports = router;