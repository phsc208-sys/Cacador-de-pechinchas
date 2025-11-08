// importarNF.js
const axios = require('axios');
const cheerio = require('cheerio');

// --- Configuração ---

// O URL da nota fiscal que você quer importar
const nfURL = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31251032907983000998651040001446101301679146|2|1|1|47e517fe819a18f852aa6202b98b8184f739405d";

// O URL da sua API (definido no seu app.js)
const apiURL = "http://localhost:3000/supermercados";

// --- Função Principal ---

async function importarNota() {
  try {
    console.log(`Baixando dados de: ${nfURL}`);
    
    // 1. Baixar o HTML da página da NF
    const { data: html } = await axios.get(nfURL);
    
    // 2. Carregar o HTML no Cheerio
    const $ = cheerio.load(html);

    // 3. Extrair os dados (com seletores corretos)
    
    // Pega o nome do supermercado
    const nomeSupermercado = $('div#u20 > h4').text().trim(); // <<< ATUALIZADO <<<
    
    // Pega o endereço e a cidade
    const endereco = $('span#u28').text().trim(); // <<< ATUALIZADO <<<
    const cidade = $('span#u29').text().trim().split(' - ')[0]; // <<< ATUALIZADO <<<

    const produtos = [];
    
    // Itera sobre a tabela de produtos
    $('div#tabProd tbody tr').each((index, element) => { // <<< ATUALIZADO <<<
      const $row = $(element);
      
      // Pega o nome do produto (o primeiro span.TextoFixo da linha)
      const nomeProduto = $row.find('td:nth-child(1) span.TextoFixo').text().trim(); // <<< ATUALIZADO <<<
      
      // Pega o preço (o span.Valor da linha)
      const precoProduto = $row.find('span.Valor').text().trim(); // <<< ATUALIZADO <<<

      if (nomeProduto && precoProduto) {
        produtos.push({
          nome: nomeProduto,
          descricao: "", // A NF não tem descrição
          preco: `R$ ${precoProduto}`, // O preço já vem com vírgula
          marca: "Marca N/D", // A NF raramente tem a marca
          imagem: "" // Deixar em branco
        });
      }
    });

    if (!nomeSupermercado || produtos.length === 0) {
      console.error("Não foi possível extrair os dados. A estrutura do site da Fazenda pode ter mudado.");
      return;
    }

    // 4. Montar o objeto JSON no formato do seu db.json
    const novoSupermercado = {
      nome: nomeSupermercado,
      cidade: cidade,
      endereco: endereco,
      telefone: "", // Não achei telefone na NF
      imagem: "",   // Você pode deixar em branco ou ter uma padrão
      destaque: false,
      produtos: produtos
    };

    // 5. Enviar os dados para o seu json-server
    console.log(`Enviando dados do '${nomeSupermercado}' para a API...`);
    const response = await axios.post(apiURL, novoSupermercado);
    
    console.log("Supermercado e produtos importados com sucesso!");
    // console.log(response.data); // Descomente se quiser ver o objeto retornado

  } catch (error) {
    console.error("Erro ao importar a nota:", error.message);
  }
}

// Inicia o processo
importarNota();