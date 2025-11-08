// processarNF.js (Responsável por ler o HTML local, extrair dados e atualizar o db.json)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Necessário para a raspagem (scraping)

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
    // Normalização: Remove 'COMERCIO DE ALIMENTOS S/A' ou 'LTDA' para obter um nome curto
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    // CNPJ e Inscrição Estadual (Ex: CNPJ: 04641376011413 -, Inscrição Estadual: 0020488291119)
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*(\d+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1] : null;

    // Endereço (Ex: AV. DOS ANDRADAS, 302, CENTRO, 3106200 - BELO HORIZONTE, MG)
    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const partes = enderecoCompleto.split(', ');
    const ufCidade = partes.pop(); // MG
    const cepCidade = partes.pop(); // 3106200 - BELO HORIZONTE
    const cidade = cepCidade ? cepCidade.split(' - ')[1] : null; // BELO HORIZONTE
    const endereco = partes.join(', ').trim(); // AV. DOS ANDRADAS, 302, CENTRO

    // --- Extrair Produtos ---
    const produtos = [];
    $('#myTable tr').each((i, row) => {
        const nomeQtde = $(row).find('td:nth-child(1) h7').text().trim();
        const nome = nomeQtde.replace(/\(Código: \d+\)/, '').trim();

        const qtdeTotalRaw = $(row).find('td:nth-child(2)').text().trim();
        const qtdeMatch = qtdeTotalRaw.match(/Qtde total de ítens: ([\d.,]+)/);
        const quantidade = qtdeMatch ? qtdeMatch[1].replace(',', '.') : '1.000'; 

        const precoRaw = $(row).find('td:nth-child(4)').text().trim();
        const precoMatch = precoRaw.match(/(R\$\s*[\d.,]+)/);
        const preco = precoMatch ? precoMatch[1] : null;

        if (nome && preco) {
            produtos.push({
                nome: nome,
                descricao: `(NF) ${quantidade} UN. Importado em ${new Date().toLocaleDateString('pt-BR')}`,
                preco: preco,
                marca: nomeSupermercado, 
                imagem: "assets/img/produtos/generico.jpg" // Imagem genérica
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
 * Atualiza o db.json com os dados extraídos, adicionando o supermercado se não existir.
 */
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
        // Gera um ID simples e adiciona
        const newId = Math.random().toString(36).substring(2, 6);
        novoSupermercado.id = newId;

        db.supermercados.push(novoSupermercado);
        supermercadoExistente = novoSupermercado;
        console.log(`\n[Processamento] Adicionado novo supermercado: ${supermercadoExistente.nome}`);
    } else {
        // Atualiza as informações básicas do supermercado se ele existir
        supermercadoExistente.cidade = novoSupermercado.cidade;
        supermercadoExistente.endereco = novoSupermercado.endereco;
        console.log(`\n[Processamento] Supermercado encontrado: ${supermercadoExistente.nome}`);
    }

    // 4. Adicionar os novos produtos (evitar duplicatas exatas)
    let produtosAdicionadosCount = 0;
    novosProdutos.forEach(novoProd => {
        // Critério de duplicidade: Nome E Preço são iguais
        const isDuplicate = supermercadoExistente.produtos.some(
            existingProd => existingProd.nome === novoProd.nome && existingProd.preco === novoProd.preco
        );

        if (!isDuplicate) {
            supermercadoExistente.produtos.push(novoProd);
            produtosAdicionadosCount++;
        }
    });

    console.log(`[Processamento] ${produtosAdicionadosCount} novos produtos adicionados ao ${supermercadoExistente.nome}.`);

    // 5. Salvar o arquivo db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[Processamento] Sucesso! O arquivo db.json foi atualizado.`);
}


// --- Lógica Principal de Execução ---
try {
    // 1. Verifica se o arquivo HTML existe
    if (!fs.existsSync(NF_HTML_PATH)) {
        throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
    }
    
    // 2. Lê o conteúdo do arquivo HTML
    const htmlContent = fs.readFileSync(NF_HTML_PATH, 'utf8');
    
    // 3. Extrai os dados
    const dados = extrairDadosNF(htmlContent);
    
    // 4. Atualiza o db.json
    atualizarDbJson(dados); 
    
} catch (error) {
    console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
    console.error(error.message);
    console.error("-------------------------------------------------");
    process.exit(1);
}