const db = require('../database/connection');

class PromocaoController {
    
    // ===== CUPONS =====
    
    // Listar cupons (admin)
    async listarCupons(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const cupons = await db.all(`
                SELECT c.*, 
                       (SELECT COUNT(*) FROM cupon_uso WHERE cupon_id = c.id) as usos_total
                FROM cupons c
                ORDER BY c.data_criacao DESC
            `);

            res.render('admin/cupons', {
                cupons: cupons,
                user: req.session.user,
                errors: req.flash('errors'),
                success: req.flash('success')
            });

        } catch (error) {
            console.error('Erro ao listar cupons:', error);
            req.flash('errors', 'Erro ao carregar cupons');
            res.redirect('/admin');
        }
    }

    // Criar cupom
    async criarCupom(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { codigo, tipo, valor, validade, uso_maximo } = req.body;

            if (!codigo || !tipo || !valor) {
                req.flash('errors', 'Preencha todos os campos obrigatórios');
                return res.redirect('/admin/cupons');
            }

            if (tipo === 'percentual' && (valor < 1 || valor > 100)) {
                req.flash('errors', 'Desconto percentual deve ser entre 1 e 100');
                return res.redirect('/admin/cupons');
            }

            await db.run(`
                INSERT INTO cupons (codigo, tipo, valor, validade, uso_maximo)
                VALUES (?, ?, ?, ?, ?)
            `, [codigo.toUpperCase(), tipo, valor, validade || null, uso_maximo || 1]);

            req.flash('success', `Cupom ${codigo.toUpperCase()} criado com sucesso!`);
            res.redirect('/admin/cupons');

        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                req.flash('errors', 'Código de cupom já existe');
            } else {
                console.error('Erro ao criar cupom:', error);
                req.flash('errors', 'Erro ao criar cupom');
            }
            res.redirect('/admin/cupons');
        }
    }

    // Editar cupom
    async editarCupom(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;
            const { codigo, tipo, valor, validade, uso_maximo, ativo } = req.body;

            await db.run(`
                UPDATE cupons 
                SET codigo = ?, tipo = ?, valor = ?, validade = ?, uso_maximo = ?, ativo = ?
                WHERE id = ?
            `, [codigo.toUpperCase(), tipo, valor, validade || null, uso_maximo || 1, ativo, id]);

            req.flash('success', 'Cupom atualizado com sucesso!');
            res.redirect('/admin/cupons');

        } catch (error) {
            console.error('Erro ao editar cupom:', error);
            req.flash('errors', 'Erro ao editar cupom');
            res.redirect('/admin/cupons');
        }
    }

    // Deletar cupom
    async deletarCupom(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;
            await db.run('DELETE FROM cupons WHERE id = ?', [id]);

            req.flash('success', 'Cupom deletado com sucesso!');
            res.redirect('/admin/cupons');

        } catch (error) {
            console.error('Erro ao deletar cupom:', error);
            req.flash('errors', 'Erro ao deletar cupom');
            res.redirect('/admin/cupons');
        }
    }

    // Validar cupom (API)
    async validarCupom(req, res) {
        try {
            const { codigo, subtotal } = req.body;

            if (!codigo || !subtotal) {
                return res.json({ valido: false, mensagem: 'Dados incompletos' });
            }

            const cupom = await db.get(`
                SELECT * FROM cupons 
                WHERE codigo = ? AND ativo = 1 
                AND (validade IS NULL OR validade > datetime('now'))
                AND (uso_maximo IS NULL OR usos < uso_maximo)
            `, [codigo.toUpperCase()]);

            if (!cupom) {
                return res.json({ valido: false, mensagem: 'Cupom inválido ou expirado' });
            }

            let desconto = 0;
            if (cupom.tipo === 'percentual') {
                desconto = (subtotal * cupom.valor) / 100;
            } else {
                desconto = cupom.valor;
            }

            desconto = Math.min(desconto, subtotal);

            res.json({
                valido: true,
                desconto: desconto,
                descontoFormatado: desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                tipo: cupom.tipo,
                valor: cupom.valor,
                codigo: cupom.codigo
            });

        } catch (error) {
            console.error('Erro ao validar cupom:', error);
            res.json({ valido: false, mensagem: 'Erro ao validar cupom' });
        }
    }

    // ===== BANNERS =====
    
    // Listar banners (admin)
    async listarBanners(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const banners = await db.all(`
                SELECT * FROM banners ORDER BY ordem ASC
            `);

            res.render('admin/banners', {
                banners: banners,
                user: req.session.user,
                errors: req.flash('errors'),
                success: req.flash('success')
            });

        } catch (error) {
            console.error('Erro ao listar banners:', error);
            req.flash('errors', 'Erro ao carregar banners');
            res.redirect('/admin');
        }
    }

    // Criar banner
    async criarBanner(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { titulo, descricao, link, ordem } = req.body;
            let imagem = null;

            if (req.file) {
                imagem = `/uploads/banners/${req.file.filename}`;
            } else {
                req.flash('errors', 'Imagem é obrigatória');
                return res.redirect('/admin/banners');
            }

            await db.run(`
                INSERT INTO banners (titulo, descricao, imagem, link, ordem)
                VALUES (?, ?, ?, ?, ?)
            `, [titulo, descricao || null, imagem, link || null, ordem || 0]);

            req.flash('success', 'Banner criado com sucesso!');
            res.redirect('/admin/banners');

        } catch (error) {
            console.error('Erro ao criar banner:', error);
            req.flash('errors', 'Erro ao criar banner');
            res.redirect('/admin/banners');
        }
    }

    // Editar banner
    async editarBanner(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;
            const { titulo, descricao, link, ordem, ativo } = req.body;

            let imagemQuery = '';
            let params = [titulo, descricao || null, link || null, ordem || 0, ativo];

            if (req.file) {
                imagemQuery = ', imagem = ?';
                params.push(`/uploads/banners/${req.file.filename}`);
            }

            params.push(id);

            await db.run(`
                UPDATE banners 
                SET titulo = ?, descricao = ?, link = ?, ordem = ?, ativo = ? ${imagemQuery}
                WHERE id = ?
            `, params);

            req.flash('success', 'Banner atualizado com sucesso!');
            res.redirect('/admin/banners');

        } catch (error) {
            console.error('Erro ao editar banner:', error);
            req.flash('errors', 'Erro ao editar banner');
            res.redirect('/admin/banners');
        }
    }

    // Deletar banner
    async deletarBanner(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;
            await db.run('DELETE FROM banners WHERE id = ?', [id]);

            req.flash('success', 'Banner deletado com sucesso!');
            res.redirect('/admin/banners');

        } catch (error) {
            console.error('Erro ao deletar banner:', error);
            req.flash('errors', 'Erro ao deletar banner');
            res.redirect('/admin/banners');
        }
    }

    // ===== PROMOÇÕES DE PRODUTOS =====
    
    // Listar produtos com promoção
    async listarPromocoesProdutos(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const produtos = await db.all(`
                SELECT p.*, u.email as vendedor_email
                FROM products p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.promocao = 1 OR p.promocao IS NULL
                ORDER BY p.data_criacao DESC
            `);

            res.render('admin/promocoes-produtos', {
                produtos: produtos,
                user: req.session.user,
                errors: req.flash('errors'),
                success: req.flash('success')
            });

        } catch (error) {
            console.error('Erro ao listar promoções:', error);
            req.flash('errors', 'Erro ao carregar produtos');
            res.redirect('/admin');
        }
    }

    // Aplicar promoção em produto
    async aplicarPromocao(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;
            const { promocao, preco_promocional, data_fim_promocao } = req.body;

            if (promocao == 1 && (!preco_promocional || preco_promocional <= 0)) {
                req.flash('errors', 'Preço promocional deve ser maior que zero');
                return res.redirect('/admin/promocoes-produtos');
            }

            await db.run(`
                UPDATE products 
                SET promocao = ?, preco_promocional = ?, data_fim_promocao = ?
                WHERE id = ?
            `, [promocao, preco_promocional || null, data_fim_promocao || null, id]);

            req.flash('success', 'Promoção aplicada com sucesso!');
            res.redirect('/admin/promocoes-produtos');

        } catch (error) {
            console.error('Erro ao aplicar promoção:', error);
            req.flash('errors', 'Erro ao aplicar promoção');
            res.redirect('/admin/promocoes-produtos');
        }
    }

    // Remover promoção
    async removerPromocao(req, res) {
        try {
            if (!req.session.user || !req.session.user.isAdmin) {
                req.flash('errors', 'Acesso negado');
                return res.redirect('/');
            }

            const { id } = req.params;

            await db.run(`
                UPDATE products 
                SET promocao = 0, preco_promocional = NULL, data_fim_promocao = NULL
                WHERE id = ?
            `, [id]);

            req.flash('success', 'Promoção removida com sucesso!');
            res.redirect('/admin/promocoes-produtos');

        } catch (error) {
            console.error('Erro ao remover promoção:', error);
            req.flash('errors', 'Erro ao remover promoção');
            res.redirect('/admin/promocoes-produtos');
        }
    }
}

module.exports = new PromocaoController();