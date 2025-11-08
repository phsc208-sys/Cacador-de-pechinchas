// importarNF.js (Modo: Ler a ÚLTIMA URL de uma lista de objetos no db.json)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const nomeFicheiroSaida = 'pagina_nf.html';

// --- Função Principal ---
async function salvarPaginaHTML() {
  try {
    // --- Bloco para ler a URL do db.json ---
    let nfURL;
    try {
      // 1. Definir o caminho para o db.json
      const dbPath = path.join(__dirname, 'db', 'db.json');
      
      // 2. Ler o conteúdo do ficheiro
      const dbConteudo = fs.readFileSync(dbPath, 'utf8');
      
      // 3. Converter o JSON para um objeto JavaScript
      const db = JSON.parse(dbConteudo);
      
      // 4. Pegar a lista de URLs da nova chave "urlsNF" (lista de objetos)
      const listaUrlsObj = db.urlsNF;

      // 5. Validar a lista e pegar a última URL (objeto mais recente)
      if (!listaUrlsObj || !Array.isArray(listaUrlsObj) || listaUrlsObj.length === 0) {
        throw new Error("A lista 'urlsNF' está vazia no db.json. Salve uma URL usando a página 'Importar NF' (com o JSON-Server rodando).");
      }
      
      // 6. Pegar o último item (o mais recente) da lista e extrair a propriedade 'url'
      const ultimoItem = listaUrlsObj[listaUrlsObj.length - 1];
      nfURL = ultimoItem.url; // Pega o valor da propriedade 'url'

      if (!nfURL) {
        throw new Error("A última URL na lista está vazia ou é inválida.");
      }

    } catch (dbError) {
      console.error("Erro ao ler ou processar o db.json:", dbError.message);
      return; // Para a execução se não conseguir a URL
    }
    // --- Fim do bloco de leitura ---


    console.log(`Baixando dados da URL mais recente: ${nfURL}`);
    
    // 1. Baixar o HTML (usando a URL vinda do JSON)
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // 2. Definir o caminho completo onde o ficheiro será salvo
    const caminhoCompleto = path.join(__dirname, nomeFicheiroSaida);

    // 3. Salvar o HTML no ficheiro
    fs.writeFileSync(caminhoCompleto, html, 'utf8');
    
    console.log(`\nSucesso! O HTML da página foi salvo em:`);
    console.log(caminhoCompleto);
    console.log(`\nAbra este ficheiro (${nomeFicheiroSaida}) no seu navegador ou editor de código para inspecionar.`);

  } catch (error) {
    console.error("Erro ao baixar ou salvar a página:", error.message);
  }
}

// Inicia o processo
salvarPaginaHTML();