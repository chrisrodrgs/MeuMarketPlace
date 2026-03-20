const db = require('../database/connection');

class Produtos {
    constructor(body) {
        this.body = body;
        this.errors = [];
    }

    async register(usuarioId, imagemPath = null) {
        this.valida();
        if (this.errors.length > 0) return;

        await this.productExists(this.body.name);
        if (this.errors.length > 0) return;

        try {
            const result = await db.run(
                `INSERT INTO products (
                    name, 
                    description, 
                    price, 
                    categoria, 
                    usuario_id, 
                    imagem,
                    data_criacao
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                [
                    this.body.name,
                    this.body.description,
                    this.body.price,
                    this.body.categoria,
                    usuarioId,
                    imagemPath
                ]
            );

            return { id: result.id };
        } catch (e) {
            console.error(e);
            this.errors.push('Erro ao cadastrar produto');
        }
    }

    async edit(id, usuarioId) {
        if (!id) return;

        this.valida();
        if (this.errors.length > 0) return;

        await this.productExists(this.body.name, id);
        if (this.errors.length > 0) return;

        await db.run(
            `UPDATE products SET name = ?, description = ?, price = ? 
             WHERE id = ? AND usuario_id = ?`,
            [
                this.body.name,
                this.body.description,
                this.body.price,
                id,
                usuarioId
            ]
        );
        return await Produtos.buscarPorId(id);
    }

    async productExists(name, id = null) {
        if (!name) return;

        const product = await db.get(
            `SELECT * FROM products WHERE name = ?`,
            [name]
        );

        const convertId = id ? Number(id) : null;

        if (product && product.id !== convertId) {
            this.errors.push('Há no banco um produto com este nome cadastrado.');
        }
    }

    static async buscarPorId(id) {
        return await db.get(
            `SELECT * FROM products WHERE id = ?`,
            [id]
        );
    }

    static async buscarPorUsuario(usuarioId) {
        return await db.all(
            `SELECT * FROM products WHERE usuario_id = ? ORDER BY id DESC`,
            [usuarioId]
        );
    }

    static async delete(id, usuarioId) {
        return await db.run(
            `DELETE FROM products WHERE id = ? AND usuario_id = ?`,
            [id, usuarioId]
        );
    }

    valida() {
        this.cleanUp();
        if (!this.body.name) {
            this.errors.push('Nome é obrigatório!');
        }
        if (!this.body.description) {
            this.errors.push('Descrição é obrigatória!');
        }
        if (!this.body.price) {
            this.errors.push('Preço é obrigatório!');
        }
        if (this.body.price && isNaN(this.body.price)) {
            this.errors.push('Preço deve ser um número válido!');
        }
    }

    cleanUp() {
        for (let key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }

        this.body = {
            name: this.body.name || '',
            description: this.body.description || '',
            price: this.body.price || '',
            categoria: this.body.categoria || ''
        };
    }
}

module.exports = Produtos;