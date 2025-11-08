// importarNF.js (Modo: Ler URL do argumento da linha de comando e Salvar o HTML)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const nomeFicheiroSaida = 'pagina_nf.html';

// --- Função Principal ---
async function salvarPaginaHTML() {
  // Pega a URL diretamente do argumento da linha de comando (process.argv[2])
  // O process.argv[0] é 'node', process.argv[1] é 'importarNF.js'
  const nfURL = process.argv[2];
  
  if (!nfURL) {
      console.error("ERRO: URL da Nota Fiscal não fornecida como argumento.");
      process.exit(1); // Sai com código de erro
  }

  try {
    console.log(`Baixando dados da URL (Automação): ${nfURL}`);
    
    // 1. Download do HTML
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // 2. Salvamento do HTML em arquivo
    const caminhoCompleto = path.join(__dirname, nomeFicheiroSaida);

    fs.writeFileSync(caminhoCompleto, html, 'utf8');
    
    console.log(`\nSucesso! O HTML da página foi salvo em:`);
    console.log(caminhoCompleto);
    
  } catch (error) {
    console.error("\n--- ERRO NO PROCESSO DE DOWNLOAD ---");
    if (error.response) {
      console.error(`Erro HTTP ${error.response.status} ao tentar acessar a NF: ${nfURL}`);
    } else {
      console.error("Erro ao baixar ou salvar a página:", error.message);
    }
    console.error("---------------------------------------");
    process.exit(1);
  }
}

// Inicia o processo
salvarPaginaHTML();