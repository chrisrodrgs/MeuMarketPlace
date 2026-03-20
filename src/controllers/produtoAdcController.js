const db = require('../database/connection');
const Produtos = require('../models/ProdutosModel');
const multer = require('multer');
const multerConfig = require('../config/multerConfig');
const upload = multer(multerConfig).single('imagem');

const categorias = [
    'Café da manhã',
    'Doces',
    'Salgados',
    'Bebidas',
    'Descartáveis'
];

exports.renderAddForm = (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para adicionar produtos');
            return res.redirect('/login/index');
        }

        res.render('adicionar-produto', {
            usuario: req.session.user,
            categorias: categorias,
            errors: req.flash('errors'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error("Erro ao carregar formulário:", error);
        res.status(500).send("Erro interno do servidor.");
    }
};

// Middleware para upload
exports.uploadImagem = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            req.flash('errors', `Erro no upload: ${err.message}`);
            return res.redirect('/produtos/adicionar');
        } else if (err) {
            req.flash('errors', err.message);
            return res.redirect('/produtos/adicionar');
        }
        next();
    });
};

exports.addProduto = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('errors', 'Você precisa estar logado para adicionar produtos');
            return res.redirect('/login/index');
        }

        const { nome, descricao, preco, categoria, estoque, status } = req.body;

        console.log('📦 Recebendo dados do produto:', { nome, descricao, preco, categoria, estoque, status });

        // Validações
        if (!nome || !descricao || !preco || !categoria || !estoque) {
            req.flash('errors', 'Todos os campos são obrigatórios');
            return res.redirect('/produtos/adicionar');
        }

        if (isNaN(preco) || preco <= 0) {
            req.flash('errors', 'Preço deve ser um número válido maior que zero');
            return res.redirect('/produtos/adicionar');
        }

        if (isNaN(estoque) || estoque < 0) {
            req.flash('errors', 'Estoque deve ser um número válido maior ou igual a zero');
            return res.redirect('/produtos/adicionar');
        }

        if (!categorias.includes(categoria)) {
            req.flash('errors', 'Categoria inválida');
            return res.redirect('/produtos/adicionar');
        }

        // Validar status
        const statusFinal = status === 'ativo' ? 'ativo' : 'inativo';

        // Caminho da imagem SEM BARRA no início
        let imagemPath = null;
        if (req.file) {
            imagemPath = `uploads/produtos/${req.file.filename}`;
        }

        // Criar produto no banco
        const produto = new Produtos({
            name: nome,
            description: descricao,
            price: preco,
            categoria: categoria,
            estoque: parseInt(estoque),
            status: statusFinal
        });

        await produto.register(req.session.user.id, imagemPath);

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            return res.redirect('/produtos/adicionar');
        }

        req.flash('success', `Produto adicionado com sucesso! Status: ${statusFinal === 'ativo' ? 'Ativo' : 'Inativo'}`);
        return res.redirect('/meus-produtos');

    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        req.flash('errors', 'Erro ao adicionar produto');
        return res.redirect('/produtos/adicionar');
    }
};

exports.getCategorias = () => categorias;