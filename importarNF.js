// importarNF.js (Modo: Ler URL, Fazer Scraping e Salvar no db.json)
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // NOVO: Biblioteca para processar o HTML

// --- Configuração ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const API_URL = "http://localhost:3000/supermercados"; // URL para POST/PUT (opcional, mas bom ter)

// --- Funções de Ajuda ---

// 1. Função para extrair dados do HTML
function extrairDadosNF(html) {
    const $ = cheerio.load(html);
    
    // --- Extrair Dados do Supermercado ---
    const nomeSupermercadoRaw = $('th.text-center.text-uppercase h4 b').text().trim();
    // Supermercados BH Comercio de Alimentos S/A -> SUPERMERCADOS BH
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    // CNPJ e Inscrição Estadual estão na segunda linha da tabela principal
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*(\d+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1] : null;

    // Endereço na terceira linha
    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const [endereco, cidadeUf] = enderecoCompleto.split(', ').slice(-2);
    const [cidade, uf] = cidadeUf ? cidadeUf.split(' - ') : [null, null];

    // --- Extrair Produtos ---
    const produtos = [];
    $('#myTable tr').each((i, row) => {
        const nomeQtde = $(row).find('td:nth-child(1) h7').text().trim();
        const nome = nomeQtde.replace(/\(Código: \d+\)/, '').trim();

        // Qtde total de ítens: 2.000
        const qtdeTotalRaw = $(row).find('td:nth-child(2)').text().trim();
        const qtdeMatch = qtdeTotalRaw.match(/Qtde total de ítens: ([\d.,]+)/);
        const quantidade = qtdeMatch ? qtdeMatch[1] : '1'; 

        // Valor total R$: R$ 8,76
        const precoRaw = $(row).find('td:nth-child(4)').text().trim();
        const precoMatch = precoRaw.match(/Valor total R\$: (R\$\s*[\d.,]+)/);
        const preco = precoMatch ? precoMatch[1] : null;

        if (nome && preco) {
            produtos.push({
                nome: nome,
                descricao: `(NF) ${quantidade} UN`, 
                preco: preco,
                marca: nomeSupermercado, // Usamos o nome do supermercado como marca provisória
                imagem: "assets/img/produtos/generico.jpg" // Imagem genérica
            });
        }
    });

    return {
        supermercado: {
            nome: nomeSupermercado,
            cnpj: cnpj,
            cidade: cidade,
            endereco: endereco,
            telefone: 'N/A', 
            imagem: `assets/img/${nomeSupermercado.toLowerCase().replace(/ /g, '')}.jpg`, // Tenta criar um nome de imagem
            destaque: false,
        },
        produtos: produtos
    };
}


// 2. Função para atualizar o db.json
function atualizarDbJson(dadosExtraidos) {
    // 1. Ler o arquivo db.json
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);

    const novoSupermercado = dadosExtraidos.supermercado;
    const novosProdutos = dadosExtraidos.produtos;
    
    // 2. Tentar encontrar o supermercado existente pelo nome
    let supermercadoExistente = db.supermercados.find(s => 
        s.nome.toLowerCase() === novoSupermercado.nome.toLowerCase()
    );

    // 3. Se não encontrar, adiciona um novo supermercado
    if (!supermercadoExistente) {
        // Gera um ID simples (JSON-Server adicionaria um ID automaticamente se fosse POST/PUT, 
        // mas aqui estamos reescrevendo o arquivo, então precisamos de um)
        const newId = (Math.random() * 10000).toFixed(0).toString();
        novoSupermercado.id = newId;

        db.supermercados.push(novoSupermercado);
        supermercadoExistente = novoSupermercado;
        console.log(`\nAdicionado novo supermercado: ${supermercadoExistente.nome}`);
    } else {
        console.log(`\nSupermercado encontrado: ${supermercadoExistente.nome}`);
    }

    // 4. Adicionar os novos produtos (evitar duplicatas exatas se a NF for consultada de novo)
    novosProdutos.forEach(novoProd => {
        const isDuplicate = supermercadoExistente.produtos.some(
            existingProd => existingProd.nome === novoProd.nome && existingProd.preco === novoProd.preco
        );

        if (!isDuplicate) {
            supermercadoExistente.produtos.push(novoProd);
        }
    });

    console.log(`\nTotal de ${novosProdutos.length} produtos encontrados na NF.`);
    console.log(`Produtos adicionados ao ${supermercadoExistente.nome} (duplicatas ignoradas).`);

    // 5. Salvar o arquivo db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`\nSucesso! O arquivo db.json foi atualizado.`);
}


// --- Função Principal ---
async function salvarPaginaHTML() {
  let htmlContent;
  
  try {
    // --- Bloco 1: Leitura da URL do db.json ---
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);
    const listaUrlsObj = db.urlsNF;

    if (!listaUrlsObj || !Array.isArray(listaUrlsObj) || listaUrlsObj.length === 0) {
        throw new Error("A lista 'urlsNF' está vazia no db.json. Salve uma URL usando a página 'Importar NF'.");
    }
    
    const ultimoItem = listaUrlsObj[listaUrlsObj.length - 1];
    const nfURL = ultimoItem.url; 

    console.log(`Baixando dados da URL mais recente: ${nfURL}`);
    
    // --- Bloco 2: Download do HTML ---
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });
    htmlContent = html; // Armazena o HTML em memória
    console.log("Download do HTML concluído.");

    // --- Bloco 3: Extração e Salvamento ---
    const dados = extrairDadosNF(htmlContent);
    
    // Esta função agora LÊ e ESCREVE diretamente no db.json
    atualizarDbJson(dados); 
    
  } catch (error) {
    console.error("\n--- ERRO NO PROCESSO DE IMPORTAÇÃO ---");
    // Verifica se é erro de rede ou de scraping
    if (error.response) {
      console.error(`Erro HTTP ${error.response.status} ao tentar acessar a NF.`);
    } else if (error.message.includes('db.json')) {
      console.error(error.message);
    } else {
      console.error("Erro ao baixar, fazer scraping ou salvar:", error.message);
    }
    console.error("---------------------------------------");
  }
}

// Inicia o processo
salvarPaginaHTML();