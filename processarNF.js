// processarNF.js (Organização dos dados com CNPJ, Datas, CÁLCULO DE PREÇO UNITÁRIO e CATEGORIZAÇÃO IA)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

// --- Configuração de Caminhos e IA ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const NF_HTML_PATH = path.join(__dirname, 'pagina_nf.html');
// URL do Gemini Flash, usando a versão que suporta JSON Schema
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
// ATENÇÃO: A chave deve ser fornecida pelo ambiente, insira aqui ou exporte como variável de ambiente.
const API_KEY = "AIzaSyCmkJ0nkvtNOebCc2E5CDnM_V2l2UtAQBY"; 

// --- Funções de IA e Ajuda ---

/**
 * Chama o modelo Gemini para decifrar e categorizar nomes de produtos abreviados.
 */
async function categorizarProdutosComIA(produtos) {
    if (produtos.length === 0) return null;
    
    // Mapeia o array de produtos para extrair apenas os nomes abreviados
    const nomesAbreviados = produtos.map(p => p.nome);
    
    const userQuery = `Decifre e categorize os seguintes nomes de produtos abreviados de notas fiscais de supermercado. Devolva a resposta estritamente no formato JSON, seguindo a estrutura fornecida.
    
    Nomes para processar: ${nomesAbreviados.join('; ')}`;

    const systemPrompt = `Você é um especialista em varejo e decifração de abreviações de produtos de notas fiscais brasileiras. Para cada nome abreviado fornecido, você deve:
    1. Decifrar o nome completo do produto (Ex: 'LTE L V CAM INT 1L' -> 'Leite Integral Camponesa 1 Litro').
    2. Categorizar o produto em 'Categoria Principal' (Ex: Alimentos, Higiene, Limpeza).
    3. Categorizar o produto em uma 'Subcategoria' (Ex: Laticínios, Cereais, Sabonetes).
    
    A saída DEVE ser um array JSON de objetos, onde cada objeto tem as chaves: 'nome_original', 'nome_decifrado', 'categoria_principal', e 'subcategoria'.`;

    // Estrutura JSON esperada para garantir a formatação
    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "nome_original": { "type": "STRING" },
                "nome_decifrado": { "type": "STRING" },
                "categoria_principal": { "type": "STRING" },
                "subcategoria": { "type": "STRING" }
            },
            propertyOrdering: ["nome_original", "nome_decifrado", "categoria_principal", "subcategoria"]
        }
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            // Verifica a chave antes de fazer a chamada
            if (!API_KEY || API_KEY === "") {
                console.error("[IA] ERRO: Chave API não configurada. Categorização pulada.");
                return null;
            }
            
            const response = await fetch(GEMINI_API_URL + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Erro HTTP ${response.status}: ${JSON.stringify(errorBody)}`);
            }

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (jsonText) {
                // Tenta fazer o parse do JSON retornado pelo Gemini
                const parsedData = JSON.parse(jsonText);
                return parsedData;
            } else {
                throw new Error("Resposta da IA vazia ou mal formatada.");
            }
        } catch (error) {
            attempts++;
            console.warn(`Tentativa ${attempts} de chamada à IA falhou: ${error.message}.`);
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            } else {
                console.error("Todas as tentativas de categorização falharam. Prosseguindo sem dados da IA.");
                return null; 
            }
        }
    }
}


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
    const dataEmissaoRaw = $('#collapse4 table.table-hover').eq(2).find('tbody tr td:nth-Gchild(4)').text().trim();
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
        
        // --- CORREÇÃO APLICADA AQUI ---
        const precoTotal = precoMatch ? precoMatch[1] : null;
        
        if (nome && precoTotal) {
            // --- CÁLCULO DO PREÇO POR UNIDADE ---
            const quantidadeFloat = parseFloat(quantidadeString.replace(',', '.')); 
            const precoTotalFloat = parseFloat(
                precoTotal.replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.')
            );
            
            let precoUnidadeCalculado = precoTotalFloat / quantidadeFloat;
            let precoUnidadeFormatado = `R$ ${precoUnidadeCalculado.toFixed(2).replace('.', ',')}`;

            produtos.push({
                nome: nome,
                data_nota_fiscal: dataEmissaoNF, 
                preco_unidade: precoUnidadeFormatado, 
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
function atualizarDbJson(dadosExtraidos, categoriasIA) {
    // 1. Integrar as categorias da IA aos produtos
    const produtosCompletos = dadosExtraidos.produtos.map(p => {
        const categoria = categoriasIA ? categoriasIA.find(c => c.nome_original === p.nome) : null;
        return {
            ...p,
            // NOVOS CAMPOS DE CATEGORIZAÇÃO:
            nome_decifrado: categoria ? categoria.nome_decifrado : p.nome,
            categoria_principal: categoria ? categoria.categoria_principal : 'Desconhecida',
            subcategoria: categoria ? categoria.subcategoria : 'N/A'
        };
    });

    // 2. Ler e parsear o db.json
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);

    const novoSupermercado = dadosExtraidos.supermercado;
    
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

    produtosCompletos.forEach(novoProd => {
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
async function main() {
    try {
        if (!fs.existsSync(NF_HTML_PATH)) {
            throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
        }
        
        const htmlContent = fs.readFileSync(NF_HTML_PATH, 'utf8');
        const dados = extrairDadosNF(htmlContent);
        
        // --- NOVO: Chama a IA para categorizar ---
        console.log("[IA] Solicitando decifração e categorias ao Gemini...");
        const categoriasIA = await categorizarProdutosComIA(dados.produtos);
        console.log("[IA] Resposta do Gemini recebida.");
        
        // 4. Atualiza o db.json com os dados raspados + categorias da IA
        atualizarDbJson(dados, categoriasIA); 
        
    } catch (error) {
        console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
        console.error(error.message);
        console.error("-------------------------------------------------");
        process.exit(1);
    }
}

// Inicia o processo
main();