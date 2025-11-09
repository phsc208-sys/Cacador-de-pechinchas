// processarNF.js (Organização dos dados com CNPJ, Datas e CÁLCULO DE PREÇO UNITÁRIO)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

// --- Configuração de Caminhos ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const NF_HTML_PATH = path.join(__dirname, 'pagina_nf.html');

// --- Funções de Ajuda ---

/**
 * Normaliza e extrai todos os dados necessários do HTML da NF.
 */
function extrairDadosNF(html) {
    const $ = cheerio.load(html);
    
    // --- Extrair Dados do Supermercado ---
    const nomeSupermercadoRaw = $('th.text-center.text-uppercase h4 b').text().trim();
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    // CNPJ
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*(\d+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].replace(/[\.-]/g, '').trim() : null; 

    // Endereço
    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const partes = enderecoCompleto.split(', ');
    const ufCidade = partes.pop(); 
    const cepCidade = partes.pop(); 
    const cidade = cepCidade ? cepCidade.split(' - ')[1] : null; 
    const endereco = partes.join(', ').trim(); 
    
    // Data de Emissão da NF
    const dataEmissaoRaw = $('#collapse4 table.table-hover').eq(2).find('tbody tr td:nth-child(4)').text().trim();
    const dataEmissaoNF = dataEmissaoRaw.split(' ')[0] || 'N/A'; 
    
    // Data atual para auditoria de processamento
    const dataProcessamento = new Date().toLocaleDateString('pt-BR'); 

    // --- Extrair Produtos ---
    const produtos = [];
    $('#myTable tr').each((i, row) => {
        const nomeQtde = $(row).find('td:nth-child(1) h7').text().trim();
        const nome = nomeQtde.replace(/\(Código: \d+\)/, '').trim();

        // 1. EXTRAI QUANTIDADE (Qtd: 1.000 ou 0.342)
        const qtdeTotalRaw = $(row).find('td:nth-child(2)').text().trim();
        const qtdeMatch = qtdeTotalRaw.match(/Qtde total de ítens: ([\d.,]+)/);
        const quantidadeString = qtdeMatch ? qtdeMatch[1] : '1.000'; 
        
        // 2. EXTRAI PREÇO TOTAL (Valor total R$: R$ 3,79)
        const precoTotalRaw = $(row).find('td:nth-child(4)').text().trim();
        const precoMatch = precoTotalRaw.match(/(R\$\s*[\d.,]+)/);
        const precoTotal = precoMatch ? precoMatch[1] : null;
        
        if (nome && precoTotal) {
            // --- CÁLCULO DO PREÇO POR UNIDADE ---
            
            // Normaliza a Quantidade 
            const quantidadeFloat = parseFloat(quantidadeString.replace(',', '.')); 
            
            // Normaliza o Preço Total 
            const precoTotalFloat = parseFloat(
                precoTotal.replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.')
            );
            
            let precoUnidadeCalculado = precoTotalFloat / quantidadeFloat;
            
            // Formata o Preço Unitário de volta para string R$ X,XX
            let precoUnidadeFormatado = `R$ ${precoUnidadeCalculado.toFixed(2).replace('.', ',')}`;

            // ------------------------------------

            produtos.push({
                nome: nome,
                data_nota_fiscal: dataEmissaoNF, 
                // Valor por unidade (será o preço visível)
                preco_unidade: precoUnidadeFormatado, 
                // **CAMPO REMOVIDO**: preco_total_nf (valor total da linha)
                quantidade: quantidadeString,
                data_processamento: dataProcessamento, 
                marca: nomeSupermercado, 
                imagem: "assets/img/produtos/generico.jpg" 
            });
        }
    });

    return {
        supermercado: {
            nome: nomeSupermercado,
            cnpj: cnpj, 
            cidade: cidade || 'N/A',
            endereco: endereco || 'N/A',
            telefone: 'N/A', 
            imagem: `assets/img/${nomeSupermercado.toLowerCase().replace(/ /g, '')}.jpg`, 
            destaque: false,
        },
        produtos: produtos
    };
}

/**
 * Atualiza o db.json usando o CNPJ como identificador do Supermercado.
 */
function atualizarDbJson(dadosExtraidos) {
    // 1. Ler o arquivo db.json
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);

    const novoSupermercado = dadosExtraidos.supermercado;
    const novosProdutos = dadosExtraidos.produtos;
    
    // --- Tentar encontrar o supermercado pelo CNPJ ---
    let supermercadoExistente = db.supermercados.find(s => 
        s.cnpj === novoSupermercado.cnpj
    );

    // Fallback: Se a busca por CNPJ falhar, tentamos a busca por nome
    if (!supermercadoExistente) {
        supermercadoExistente = db.supermercados.find(s => 
            s.nome.toLowerCase() === novoSupermercado.nome.toLowerCase()
        );
    }
    // --- FIM DA BUSCA ---

    // 3. Se não encontrar (novo estabelecimento)
    if (!supermercadoExistente) {
        const newId = Math.random().toString(36).substring(2, 6);
        novoSupermercado.id = newId;
        novoSupermercado.produtos = []; 

        db.supermercados.push(novoSupermercado);
        supermercadoExistente = novoSupermercado;
        console.log(`\n[Processamento] Adicionado novo supermercado (ID: ${newId}): ${supermercadoExistente.nome}`);
    } else {
        // 4. Se encontrar, atualiza CNPJ (se estiver faltando) e Endereço
        if (!supermercadoExistente.cnpj && novoSupermercado.cnpj) {
             supermercadoExistente.cnpj = novoSupermercado.cnpj;
        }
        supermercadoExistente.cidade = novoSupermercado.cidade;
        supermercadoExistente.endereco = novoSupermercado.endereco;
        console.log(`\n[Processamento] Supermercado encontrado (CNPJ: ${supermercadoExistente.cnpj}): ${supermercadoExistente.nome}`);
    }

    // 5. Adicionar os novos produtos
    let produtosAdicionadosCount = 0;
    if (!supermercadoExistente.produtos || !Array.isArray(supermercadoExistente.produtos)) {
        supermercadoExistente.produtos = [];
    }

    novosProdutos.forEach(novoProd => {
        // Critério de duplicidade: Nome, Preço UNITÁRIO E Data da Nota Fiscal são iguais
        const isDuplicate = supermercadoExistente.produtos.some(
            existingProd => 
                existingProd.nome === novoProd.nome && 
                existingProd.preco_unidade === novoProd.preco_unidade && 
                existingProd.data_nota_fiscal === novoProd.data_nota_fiscal
        );

        if (!isDuplicate) {
            supermercadoExistente.produtos.push(novoProd);
            produtosAdicionadosCount++;
        }
    });

    console.log(`[Processamento] ${produtosAdicionadosCount} novos produtos adicionados ao ${supermercadoExistente.nome}.`);

    // 6. Salvar o arquivo db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[Processamento] Sucesso! O arquivo db.json foi atualizado.`);
}


// --- Lógica Principal de Execução ---
try {
    if (!fs.existsSync(NF_HTML_PATH)) {
        throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
    }
    
    const htmlContent = fs.readFileSync(NF_HTML_PATH, 'utf8');
    const dados = extrairDadosNF(htmlContent);
    
    atualizarDbJson(dados); 
    
} catch (error) {
    console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
    console.error(error.message);
    console.error("-------------------------------------------------");
    process.exit(1);
}