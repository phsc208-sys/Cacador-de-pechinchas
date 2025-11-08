// importarNF.js (Modo: Ler URL do db.json e Salvar o HTML em arquivo)
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// const cheerio = require('cheerio'); // Removido

// --- Configuração ---
const DB_PATH = path.join(__dirname, 'db', 'db.json'); // Caminho para o db.json
const nomeFicheiroSaida = 'pagina_nf.html'; // Arquivo de saída

// --- Função Principal ---
async function salvarPaginaHTML() {
  let nfURL;
  
  try {
    // --- Bloco 1: Leitura da URL do db.json ---
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);
    const listaUrlsObj = db.urlsNF;

    if (!listaUrlsObj || !Array.isArray(listaUrlsObj) || listaUrlsObj.length === 0) {
        throw new Error("A lista 'urlsNF' está vazia no db.json. Salve uma URL usando a página 'Importar NF'.");
    }
    
    // Pega o último item (o mais recente)
    const ultimoItem = listaUrlsObj[listaUrlsObj.length - 1];
    nfURL = ultimoItem.url; 

    console.log(`Baixando dados da URL mais recente: ${nfURL}`);
    
    // --- Bloco 2: Download do HTML ---
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // --- Bloco 3: Salvamento do HTML em arquivo (REVERTIDO) ---
    const caminhoCompleto = path.join(__dirname, nomeFicheiroSaida);

    fs.writeFileSync(caminhoCompleto, html, 'utf8');
    
    console.log(`\nSucesso! O HTML da página foi salvo em:`);
    console.log(caminhoCompleto);
    console.log(`\nAbra este ficheiro (${nomeFicheiroSaida}) no seu navegador ou editor de código para inspecionar.`);
    
  } catch (error) {
    console.error("\n--- ERRO NO PROCESSO DE IMPORTAÇÃO ---");
    if (error.response) {
      console.error(`Erro HTTP ${error.response.status} ao tentar acessar a NF: ${nfURL}`);
    } else if (error.message.includes('db.json')) {
      console.error(error.message);
    } else {
      console.error("Erro ao baixar ou salvar a página:", error.message);
    }
    console.error("---------------------------------------");
  }
}

// Inicia o processo
salvarPaginaHTML();