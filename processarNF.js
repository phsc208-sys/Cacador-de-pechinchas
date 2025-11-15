// processarNF.js (Modo HÍBRIDO: Cache + Fetch da IA + Mapa PDM)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

// --- Configuração de Caminhos ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const NF_HTML_PATH = path.join(__dirname, 'pagina_nf.html');
// Caminho 1: O CACHE DA IA (O seu arquivo original)
const CATEGORIAS_MAP_PATH = path.join(__dirname, 'db', 'definição_map.json');
// Caminho 2: O SEU MAPA GIGANTE (Nível 1 > Nível 2 > Nível 3 PDM)
const PDM_MAP_PATH = path.join(__dirname, 'db', 'pdm_map.json'); 

// --- Configuração da IA (Usando Fetch, como no seu original) ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=";
// A SUA CHAVE DE API ORIGINAL:
const API_KEY = "AIzaSyCmkJ0nkvtNOebCc2E5CDnM_V2l2UtAQBY"; //

// --- Função da IA (Usando Fetch) ---
async function categorizarProdutosComIA(produtos) {
    if (produtos.length === 0) return null;
    
    const nomesAbreviados = produtos.map(p => p.nome);
    const userQuery = `Decifre e categorize os seguintes nomes de produtos abreviados de notas fiscais de supermercado. Devolva a resposta estritamente no formato JSON, seguindo a estrutura fornecida.
    
    Nomes para processar: ${nomesAbreviados.join('; ')}`;

    const systemPrompt = `Você é um especialista em varejo e decifração de abreviações de produtos de notas fiscais brasileiras. Para cada nome abreviado fornecido, você deve:
    1. Decifrar o nome completo do produto (Ex: 'LTE L V CAM INT 1L' -> 'Leite Integral Camponesa 1 Litro'). Este é o "nome_decifrado".
    2. Categorizar o produto em 'Categoria Principal' (Ex: Alimentos, Higiene, Limpeza).
    3. Categorizar o produto em uma 'Subcategoria' (Ex: Laticínios, Cereais, Sabonetes).
    
    A saída DEVE ser um array JSON de objetos, onde cada objeto tem as chaves: 'nome_original', 'nome_decifrado', 'categoria_principal', e 'subcategoria'.`;
    
    // Schema (Apenas para o prompt, já que fetch não o impõe)
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
        }
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            // responseSchema: responseSchema, // 'fetch' não suporta schema, mas o prompt o instrui
            temperature: 0.2
        }
    };

    try {
        if (!API_KEY) {
            console.error("[IA] ERRO: Chave API não configurada.");
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
            return JSON.parse(jsonText);
        } else {
            throw new Error("Resposta da IA vazia ou mal formatada.");
        }
    } catch (error) {
        console.error(`[IA] Falha na chamada da IA (fetch): ${error.message}.`);
        return nomesAbreviados.map(nome => ({
            nome_original: nome,
            nome_decifrado: nome,
            categoria_principal: "FALHA NA IA",
            subcategoria: "FALHA NA IA"
        }));
    }
}

// --- FUNÇÃO DE EXTRAÇÃO (SCRAPING) ---
// (Sua função original)
function extrairDadosNF(html) {
    const $ = cheerio.load(html);
    const nomeSupermercadoRaw = $('th.text-center.text-uppercase h4 b').text().trim();
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*([\d\.\/-]+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].trim() : null; 

    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const partes = enderecoCompleto.split(', ');
    const ufCidade = partes.pop() || ''; 
    const cepCidade = partes.pop() || ''; 
    const cidade = cepCidade ? cepCidade.split(' - ')[1] : (ufCidade.split(' - ')[1] || 'N/A'); 
    const endereco = partes.join(', ').trim(); 
    
    const dataEmissaoRaw = $('#collapse4 table.table-hover').eq(2).find('tbody tr td:nth-child(4)').text().trim();
    const dataEmissaoNF = dataEmissaoRaw.split(' ')[0] || 'N/A'; 
    const dataProcessamento = new Date().toLocaleDateString('pt-BR'); 

    const produtos = [];
    $('#myTable tr').each((i, row) => {
        const nomeQtde = $(row).find('td:nth-child(1) h7').text().trim();
        const nome = nomeQtde.replace(/\(Código: \d+\)/, '').trim();

        const qtdeTotalRaw = $(row).find('td:nth-child(2)').text().trim();
        const qtdeMatch = qtdeTotalRaw.match(/Qtde total de ítens: ([\d.,]+)/);
        const quantidadeString = qtdeMatch ? qtdeMatch[1] : '1.000'; 
        
        const precoTotalRaw = $(row).find('td:nth-child(4)').text().trim();
        const precoMatch = precoTotalRaw.match(/(R\$\s*[\d.,]+)/);
        const precoTotal = precoMatch ? precoMatch[1] : null;
        
        if (nome && precoTotal) {
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
            cidade: cidade,
            endereco: endereco,
            telefone: 'N/A', 
            imagem: `assets/img/supermercadosbh.jpg`, 
            destaque: false,
        },
        produtos: produtos
    };
}

// --- NOVAS FUNÇÕES PARA O PDM (NÍVEL 3) ---

function normalizar(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") 
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"?]/g, ""); 
}

function encontrarPDM(nomeDecifrado, pdmMap) {
    const nomeNormalizado = normalizar(nomeDecifrado);
    let melhorMatch = "NÃO CATEGORIZADO";
    let tamanhoMelhorMatch = 0;

    for (const categoria in pdmMap) { 
        const subcategorias = pdmMap[categoria];
        for (const subcategoria in subcategorias) { 
            const pdmLista = subcategorias[subcategoria];
            for (const pdm of pdmLista) { 
                const pdmNormalizado = normalizar(pdm);
                
                if (!pdmNormalizado || pdmNormalizado.length < 3) continue; 

                if (nomeNormalizado.includes(pdmNormalizado)) {
                    if (pdmNormalizado.length > tamanhoMelhorMatch) {
                        tamanhoMelhorMatch = pdmNormalizado.length;
                        melhorMatch = pdm; 
                    }
                }
            }
        }
    }
    return melhorMatch;
}

// --- FUNÇÃO DE ATUALIZAÇÃO DO DB (MODIFICADA) ---
function atualizarDbJson(dadosSupermercado, produtosParaAdicionar, categoriasIA, pdmMap) {
    const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbConteudo);

    let supermercadoExistente = db.supermercados.find(s => s.cnpj === dadosSupermercado.cnpj);

    if (!supermercadoExistente) {
        const newId = Math.random().toString(36).substring(2, 6);
        dadosSupermercado.id = newId;
        dadosSupermercado.produtos = [];
        db.supermercados.push(dadosSupermercado);
        supermercadoExistente = dadosSupermercado;
        console.log(`\n[Processamento] Adicionado novo supermercado (ID: ${newId}): ${supermercadoExistente.nome}`);
    } else {
        supermercadoExistente.cidade = dadosSupermercado.cidade;
        supermercadoExistente.endereco = dadosSupermercado.endereco;
        console.log(`\n[Processamento] Supermercado encontrado (CNPJ: ${supermercadoExistente.cnpj}): ${supermercadoExistente.nome}`);
    }

    let produtosAdicionadosCount = 0;
    if (!supermercadoExistente.produtos) supermercadoExistente.produtos = [];

    produtosParaAdicionar.forEach(prodNF => {
        const isDuplicate = supermercadoExistente.produtos.some(
            existingProd => 
                existingProd.nome === prodNF.nome && 
                existingProd.preco_unidade === prodNF.preco_unidade && 
                existingProd.data_nota_fiscal === prodNF.data_nota_fiscal
        );

        if (!isDuplicate) {
            // Pega os dados do cache da IA (Níveis 1, 2, 4)
            const infoIA = categoriasIA[prodNF.nome] || {
                nome_decifrado: prodNF.nome,
                categoria_principal: "NÃO CATEGORIZADO",
                subcategoria: "NÃO CATEGORIZADO"
            };

            // Procura o PDM (Nível 3) usando o nome destrinchado (Nível 4)
            const pdmEncontrado = encontrarPDM(infoIA.nome_decifrado, pdmMap);

            // Monta o objeto final com os 4 NÍVEIS
            const produtoFinal = {
                ...prodNF, 
                nome_decifrado: infoIA.nome_decifrado,          // Nível 4
                categoria_principal: infoIA.categoria_principal, // Nível 1
                subcategoria: infoIA.subcategoria,              // Nível 2
                pdm: pdmEncontrado                              // Nível 3
            };
            
            supermercadoExistente.produtos.push(produtoFinal);
            produtosAdicionadosCount++;
        }
    });

    console.log(`[Processamento] ${produtosAdicionadosCount} novos produtos adicionados ao ${supermercadoExistente.nome}.`);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[Processamento] Sucesso! O arquivo db.json foi atualizado.`);
}


// --- LÓGICA PRINCIPAL (HÍBRIDA + APRENDIZADO) ---
// (Esta é a sua lógica original, agora com o PDM_MAP)
async function main() {
    try {
        // 1. Carregar o Mapa PDM (Seu JSON Gigante)
        if (!fs.existsSync(PDM_MAP_PATH)) {
            throw new Error(`ERRO: O mapa PDM ('${PDM_MAP_PATH}') não foi encontrado. Renomeie seu JSON gigante para 'pdm_map.json' e coloque na pasta 'db/'.`);
        }
        const pdmMap = JSON.parse(fs.readFileSync(PDM_MAP_PATH, 'utf8'));

        // 2. Carregar o Cache da IA (definição_map.json)
        let categoriasMap = {}; // Este é o cache
        if (fs.existsSync(CATEGORIAS_MAP_PATH)) {
            categoriasMap = JSON.parse(fs.readFileSync(CATEGORIAS_MAP_PATH, 'utf8'));
        } else {
            console.warn(`[Processamento] Arquivo de cache '${CATEGORIAS_MAP_PATH}' não encontrado. Criando um novo...`);
        }

        // 3. Extrair dados da NF (Scraping)
        if (!fs.existsSync(NF_HTML_PATH)) {
            throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
        }
        const htmlContent = fs.readFileSync(NF_HTML_PATH, 'utf8');
        const dados = extrairDadosNF(htmlContent);

        if (dados.produtos.length === 0) {
            console.warn("[Processamento] Nenhum produto encontrado no HTML da NF.");
            return;
        }

        // 4. Lógica de Cache (A que você já tinha)
        const produtosParaIA = dados.produtos.filter(p => !categoriasMap[p.nome]);

        // 5. Chamar a IA (se necessário)
        if (produtosParaIA.length > 0) {
            console.log(`[IA] ${produtosParaIA.length} produtos não encontrados no cache. Consultando Gemini (via fetch)...`);
            
            const resultadosIA = await categorizarProdutosComIA(produtosParaIA);
            
            if (resultadosIA) {
                console.log("[IA] Resposta do Gemini recebida. Atualizando cache...");
                
                resultadosIA.forEach(item => {
                    if (item.nome_original) { 
                        categoriasMap[item.nome_original] = {
                            nome_decifrado: item.nome_decifrado,
                            categoria_principal: item.categoria_principal,
                            subcategoria: item.subcategoria
                        };
                    }
                });

                fs.writeFileSync(CATEGORIAS_MAP_PATH, JSON.stringify(categoriasMap, null, 2), 'utf8');
                console.log(`[Processamento] Cache '${CATEGORIAS_MAP_PATH}' atualizado.`);
            }
        } else {
            console.log("[Processamento] Todos os produtos foram encontrados no cache local. IA não foi necessária.");
        }
        
        // 6. Atualizar o db.json
        // Passa os dados do Supermercado, a lista de produtos da NF,
        // o cache da IA (completo), e o mapa PDM.
        atualizarDbJson(dados.supermercado, dados.produtos, categoriasMap, pdmMap);
        
    } catch (error) {
        console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
        console.error(error.message);
        console.error("-------------------------------------------------");
        process.exit(1);
    }
}

// Inicia o processo
main();