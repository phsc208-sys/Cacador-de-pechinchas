// importarNF.js (Modo: Apenas baixar a URL e salvar o HTML)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const nomeFicheiroSaida = 'pagina_nf.html'; // Arquivo de saída

// --- Função Principal ---
async function salvarPaginaHTML() {
  // Pega a URL diretamente do argumento da linha de comando (process.argv[2])
  const nfURL = process.argv[2];
  
  if (!nfURL) {
      // Se não houver URL, o erro deve ser emitido para o server.js
      console.error("ERRO: URL da Nota Fiscal não fornecida como argumento.");
      process.exit(1); 
  }

  try {
    // 1. Download do HTML
    const { data: html } = await axios.get(nfURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // 2. Salvamento do HTML em arquivo
    const caminhoCompleto = path.join(__dirname, nomeFicheiroSaida);

    fs.writeFileSync(caminhoCompleto, html, 'utf8');
    
    // Sucesso deve ser impresso no console para o server.js capturar
    console.log(`[Download] Arquivo salvo em ${caminhoCompleto}`);
    
  } catch (error) {
    // Erros devem ser passados para o server.js
    console.error(`[Download] Falha ao baixar a NF: ${error.message}`);
    process.exit(1);
  }
}

// Inicia o processo
salvarPaginaHTML();