// importarNF.js (Modo: Salvar HTML)
const axios = require('axios');
const fs = require('fs'); // <-- NOVO: Módulo para mexer com ficheiros
const path = require('path'); // <-- NOVO: Para ajudar a criar o caminho do ficheiro

// --- Configuração ---
const nfURL = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31251032907983000998651040001446101301679146|2|1|1|47e517fe819a18f852aa6202b98b8184f739405d";

// Nome do ficheiro onde vamos salvar o HTML
const nomeFicheiroSaida = 'pagina_nf.html';

// --- Função Principal ---
async function salvarPaginaHTML() {
  try {
    console.log(`Baixando dados de: ${nfURL}`);
    
    // 1. Baixar o HTML (vamos manter o User-Agent, é uma boa prática)
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // 2. Definir o caminho completo onde o ficheiro será salvo
    // __dirname é uma variável do Node que significa "esta pasta atual"
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