// server.js
const jsonServer = require('json-server');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db', 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public'), // Serve os seus ficheiros estáticos (HTML, CSS, JS)
});

server.use(middlewares);
server.use(jsonServer.bodyParser); // Permite ao servidor ler o JSON enviado pelo frontend

const baseURL = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=";
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
};

/**
 * Nova Rota: POST /importar-nf
 * Espera um JSON no body: { "chave": "..." }
 */
server.post('/importar-nf', async (req, res) => {
  try {
    const { chave } = req.body;
    if (!chave) {
      return res.status(400).json({ erro: "Nenhuma chave de NF fornecida." });
    }

    const nfURL = baseURL + chave;
    console.log(`Recebida requisição para importar: ${nfURL}`);

    // 1. Baixar o HTML (lógica do antigo importarNF.js)
    const { data: html } = await axios.get(nfURL, { headers });
    
    // 2. Carregar no Cheerio
    const $ = cheerio.load(html);

    // 3. Extrair dados (seletores que descobrimos)
    const nomeSupermercado = $('table.text-center H4 b').text().trim();
    const enderecoCompleto = $('table.text-center tbody tr:nth-child(2) td').text().trim();
    const partesEndereco = enderecoCompleto.split(',');
    const cidade = partesEndereco[partesEndereco.length - 2]?.trim();
    const rua = partesEndereco[0]?.trim();

    const produtos = [];
    $('table.table-striped tbody#myTable tr').each((index, element) => {
      const $row = $(element);
      const nomeProduto = $row.find('td:nth-child(1) h7').text().trim();
      const textoPreco = $row.find('td:nth-child(4)').text().trim();
      const precoProduto = textoPreco.split('R$ ')[1];

      if (nomeProduto && precoProduto) {
        produtos.push({
          nome: nomeProduto,
          descricao: "",
          preco: `R$ ${precoProduto}`,
          marca: "Marca N/D",
          imagem: ""
        });
      }
    });

    if (!nomeSupermercado || produtos.length === 0) {
      throw new Error("Não foi possível extrair dados da NF. Seletores podem ter mudado.");
    }

    // 4. Montar o objeto
    const novoSupermercado = {
      nome: nomeSupermercado,
      cidade: cidade || "Cidade N/D",
      endereco: rua || enderecoCompleto,
      telefone: "",
      imagem: "assets/img/meuprata.jpg", // Imagem padrão
      destaque: false,
      produtos: produtos
    };

    // 5. Salvar no db.json usando a própria DB do json-server
    const db = router.db; // Pega a instância do banco de dados
    db.get('supermercados').push(novoSupermercado).write(); // Adiciona e salva

    console.log(`Sucesso: '${nomeSupermercado}' com ${produtos.length} produtos foi salvo.`);
    res.status(201).json(novoSupermercado); // Retorna sucesso

  } catch (error) {
    console.error("Erro no /importar-nf:", error.message);
    res.status(500).json({ erro: "Falha ao importar a nota fiscal.", detalhes: error.message });
  }
});

// Usa o router padrão do json-server para todas as outras rotas (GET, POST, etc. para /supermercados)
server.use(router);

// Inicia o servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor customizado rodando na porta ${PORT}`);
  console.log('API padrão: http://localhost:3000/supermercados');
  console.log('API de importação: POST http://localhost:3000/importar-nf');
});