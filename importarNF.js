// importarNF.js (Versão Final com Seletores Corretos)
const axios = require('axios');
const cheerio = require('cheerio');

// --- Configuração ---
const nfURL = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31251032907983000998651040001446101301679146|2|1|1|47e517fe819a18f852aa6202b98b8184f739405d";

// URL da sua API local
const apiURL = "http://localhost:3000/supermercados";

// --- Função Principal ---
async function importarNota() {
  try {
    console.log(`Baixando dados de: ${nfURL}`);
    
    // 1. Baixar o HTML (com o User-Agent que funcionou)
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });
    
    // 2. Carregar o HTML no Cheerio
    const $ = cheerio.load(html);

    // 3. Extrair os dados (COM OS NOVOS SELETORES)
    
    // Pega o nome do supermercado
    const nomeSupermercado = $('table.text-center H4 b').text().trim(); // <<< ATUALIZADO <<<
    
    // Pega o endereço
    const enderecoCompleto = $('table.text-center tbody tr:nth-child(2) td').text().trim(); // <<< ATUALIZADO <<<
    // Tenta extrair a cidade do endereço
    const partesEndereco = enderecoCompleto.split(',');
    const cidade = partesEndereco[partesEndereco.length - 2].trim(); // Pega a penúltima parte

    const produtos = [];
    
    // Itera sobre a tabela de produtos
    $('table.table-striped tbody#myTable tr').each((index, element) => { // <<< ATUALIZADO <<<
      const $row = $(element);
      
      const nomeProduto = $row.find('td:nth-child(1) h7').text().trim(); // <<< ATUALIZADO <<<
      
      // Pega o texto do preço (ex: "Valor total R$: R$ 3,79")
      const textoPreco = $row.find('td:nth-child(4)').text().trim(); // <<< ATUALIZADO <<<
      // Limpa o texto para pegar só o valor
      const precoProduto = textoPreco.split('R$ ')[1];

      if (nomeProduto && precoProduto) {
        produtos.push({
          nome: nomeProduto,
          descricao: "",
          preco: `R$ ${precoProduto}`, // O preço já vem formatado
          marca: "Marca N/D",
          imagem: ""
        });
      }
    });

    if (!nomeSupermercado || produtos.length === 0) {
      console.error("Não foi possível extrair os dados. Os seletores falharam.");
      return;
    }

    // 4. Montar o objeto JSON no formato do seu db.json
    const novoSupermercado = {
      nome: nomeSupermercado,
      cidade: cidade || "Cidade N/D",
      endereco: enderecoCompleto.split(',')[0], // Pega só a rua e número
      telefone: "",
      imagem: "", // Você pode adicionar um placeholder se quiser
      destaque: false,
      produtos: produtos
    };

    // 5. Enviar os dados para o seu json-server
    console.log(`Enviando dados do '${nomeSupermercado}' (${produtos.length} produtos) para a API...`);
    const response = await axios.post(apiURL, novoSupermercado);
    
    console.log("Supermercado e produtos importados com sucesso!");

  } catch (error) {
    console.error("Erro ao importar a nota:", error.message);
  }
}

// Inicia o processo
importarNota();