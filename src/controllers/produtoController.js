const fs = require('fs');
const path = require('path');

// Exporta a função para ser usada no arquivo de rotas
exports.renderEditForm = async (req, res) => {
    try {
        // Captura o ID que veio na URL e converte em número
        const produtoId = Number(req.params.id);

        // Implementação futura: Aqui vem a busca no banco de dados
        // O código abaixo é para utilizar a chamada do banco de dados: 
        // const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [produtoId]);

        // Simulação, foi criado uma "lista de produtos falsos" apenas para testar se a View está funcionando (aguardando banco de dados de produtos ficar pronto)
       
       // Produtos
        const produtosFake = [
            {
                id: 1,
                nome: "Brownie de Doce de Leite",
                descricao: "Brownie recheado com doce de leite artesanal.",
                preco: 12.50
            },
            {
                id: 2,
                nome: "Brownie de Nutella",
                descricao: "Brownie com generosa camada de Nutella.",
                preco: 14.00
            },
            {
                id: 3,
                nome: "Brownie Tradicional",
                descricao: "Brownie clássico com pedaços de chocolate meio amargo.",
                preco: 10.00
            }
        ];

        // procura na lista o produto com o ID informado, começando pelo indice 0.
        const produto = produtosFake.find(p => p.id === produtoId) || produtosFake[0];


// envia o produto encontrado para a view de edição
        res.render('editarProduto', { produto });
    } catch (error) {
        console.error("Erro ao carregar formulário de edição:", error);
        res.status(500).send("Erro interno do servidor.");
    }
};


// POST - salvar em arquivo JSON para testes
exports.updateProdutoTeste = (req, res) => {
    try {
        const produtoId = req.params.id;

        const dadosAtualizados = {
            id: produtoId,
            nome: req.body.nome,
            descricao: req.body.descricao,
            preco: req.body.preco
        };

        
        // Caminho do arquivo onde vai salvar o arquivo atualizado
        const filePath = path.join(__dirname, '..', '..', 'produto_atualizado.json');

        // Escreve o JSON no arquivo (sobrescreve o arquivo a cada alteração do produto por enquanto)
        fs.writeFileSync(
            filePath,
            JSON.stringify(dadosAtualizados, null, 2),
            'utf8'
        );

        console.log('Dados salvos em produto_atualizado.json:', dadosAtualizados);

       // exemplo de comando para redirecionar de volta para a página de edição
       // res.redirect(`/produtos/editar/${produtoId}`);

       // comando para enviar apenas uma mensagem simples confirmando atualização:
        res.send(`Produto atualizado - Produto Id: ${produtoId} >>> Foi atualizado.`);
    } catch (error) {
        console.error("Erro ao salvar produto em arquivo:", error);
        res.status(500).send("Erro ao salvar produto em arquivo.");
    }
};
