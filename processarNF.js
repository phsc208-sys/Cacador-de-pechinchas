// processarNF.js (Modo HÍBRIDO: Mapeamento Manual + Fallback IA + Categorização CATMAT)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

// --- Configuração de Caminhos ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const NF_HTML_PATH = path.join(__dirname, 'pagina_nf.html');

// MODIFICADO: Corrigido o caminho e o nome do arquivo (tinha um 'ç' inválido)
const DEFINICAO_MAP_PATH = path.join(__dirname, 'db', 'definição_map.json');

// NOVO: Caminho para o CATMAT (coloque este arquivo na raiz do projeto)
const CATMAT_PATH = path.join(__dirname, 'catmat_completo_agrupado.json');

// --- Configuração da IA (usada como fallback) ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const API_KEY = "AIzaSyCmkJ0nkvtNOebCc2E5CDnM_V2l2UtAQBY"; // Sua chave API

// NOVO: Variáveis globais para o mapa CATMAT
let catmatMap = {};
let sortedCatmatKeys = [];

// --- Função da IA (igual a antes) ---
async function categorizarProdutosComIA(produtos) {
    if (produtos.length === 0) return null;
    
    const nomesAbreviados = produtos.map(p => p.nome);
    const userQuery = `Decifre e categorize os seguintes nomes de produtos abreviados de notas fiscais de supermercado. Devolva a resposta estritamente no formato JSON, seguindo a estrutura fornecida.
    
    Nomes para processar: ${nomesAbreviados.join('; ')}`;

    const systemPrompt = `Você é um especialista em varejo e decifração de abreviações de produtos de notas fiscais brasileiras. Para cada nome abreviado fornecido, você deve:
    1. Decifrar o nome completo do produto (Ex: 'LTE L V CAM INT 1L' -> 'Leite Integral Camponesa 1 Litro').
    2. Categorizar o produto em 'Categoria Principal' (Ex: Alimentos, Higiene, Limpeza).
    3. Categorizar o produto em uma 'Subcategoria' (Ex: Laticínios, Cereais, Sabonetes).
    
    A saída DEVE ser um array JSON de objetos, onde cada objeto tem as chaves: 'nome_original', 'nome_decifrado', 'categoria_principal', e 'subcategoria'.`;

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

// --- Função de Extração (igual a antes) ---
function extrairDadosNF(html) {
    const $ = cheerio.load(html);
    
    // --- Extrair Dados do Supermercado ---
    const nomeSupermercadoRaw = $('th.text-center.text-uppercase h4 b').text().trim();
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*(\d+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].replace(/[\.-]/g, '').trim() : null; 

    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const partes = enderecoCompleto.split(', ');
    const ufCidade = partes.pop(); 
    const cepCidade = partes.pop(); 
    const cidade = cepCidade ? cepCidade.split(' - ')[1] : null; 
    const endereco = partes.join(', ').trim(); 
    
    const dataEmissaoRaw = $('#collapse4 table.table-hover').eq(2).find('tbody tr td:nth-child(4)').text().trim();
    const dataEmissaoNF = dataEmissaoRaw.split(' ')[0] || 'N/A'; 
    
    const dataProcessamento = new Date().toLocaleDateString('pt-BR'); 

    // --- Extrair Produtos ---
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
            cidade: cidade || 'N/A',
            endereco: endereco || 'N/A',
            telefone: 'N/A', 
            imagem: `assets/img/${nomeSupermercado.toLowerCase().replace(/ /g, '')}.jpg`, 
            destaque: false,
        },
        produtos: produtos
    };
}

// NOVO: Função para construir o mapa de busca do CATMAT
function buildCatmatMap() {
    console.log("[CATMAT] Carregando e processando catmat_completo_agrupado.json...");
    try {
        if (!fs.existsSync(CATMAT_PATH)) {
            console.warn(`[CATMAT] Arquivo '${CATMAT_PATH}' não encontrado. A categorização avançada será pulada.`);
            return;
        }
        
        const catmatData = JSON.parse(fs.readFileSync(CATMAT_PATH, 'utf-8'));
        
        for (const [grupo, categorias] of Object.entries(catmatData)) {
            if (typeof categorias === 'object' && categorias !== null) {
                for (const [categoria, items] of Object.entries(categorias)) {
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            catmatMap[item.toUpperCase()] = {
                                "grupo": grupo,
                                "categoria": categoria
                            };
                        }
                    }
                }
            }
        }
        
        sortedCatmatKeys = Object.keys(catmatMap).sort((a, b) => b.length - a.length);
        console.log(`[CATMAT] Mapa de categorização criado com ${sortedCatmatKeys.length} itens.`);
        
    } catch (e) {
        console.error(`[CATMAT] Erro ao processar o arquivo CATMAT: ${e.message}`);
    }
}


// MODIFICADO: Função de Atualizar o DB agora só salva os dados já processados
function atualizarDbJson(dadosSupermercado, produtosCompletos) {
    try {
        // 1. Ler e parsear o db.json
        const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
        const db = JSON.parse(dbConteudo);

        const novoSupermercado = dadosSupermercado;
        
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

    } catch (e) {
        console.error(`[Processamento] ERRO ao atualizar db.json: ${e.message}`);
        process.exit(1);
    }
}


// --- LÓGICA PRINCIPAL (MODIFICADA) ---
async function main() {
    try {
        if (!fs.existsSync(NF_HTML_PATH)) {
            throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
        }
        
        // 1. Carregar o dicionário manual (definição_map.json)
        let categoriasMap = {};
        if (fs.existsSync(DEFINICAO_MAP_PATH)) {
            categoriasMap = JSON.parse(fs.readFileSync(DEFINICAO_MAP_PATH, 'utf8'));
        } else {
            console.warn(`[Processamento] Arquivo '${DEFINICAO_MAP_PATH}' não encontrado. Criando um novo...`);
            fs.writeFileSync(DEFINICAO_MAP_PATH, JSON.stringify({}, null, 2), 'utf8');
        }

        // NOVO: Carregar o mapa CATMAT em memória
        buildCatmatMap();

        // 2. Extrair dados da NF
        const dados = extrairDadosNF(fs.readFileSync(NF_HTML_PATH, 'utf8'));
        
        // 3. Lógica Híbrida: Separar produtos que precisam da IA
        const produtosParaIA = dados.produtos.filter(p => !categoriasMap[p.nome]);

        // 4. Se houver produtos para a IA, chama a API
        if (produtosParaIA.length > 0) {
            console.log(`[IA] ${produtosParaIA.length} produtos não encontrados no mapa manual. Consultando Gemini...`);
            
            const resultadosIA = await categorizarProdutosComIA(produtosParaIA);
            
            if (resultadosIA) {
                console.log("[IA] Resposta do Gemini recebida.");
                
                let novasDefinicoes = 0;
                
                // Itera os resultados da IA (que é um ARRAY)
                resultadosIA.forEach(item => {
                    // Adiciona a nova definição ao mapa que veio do arquivo
                    categoriasMap[item.nome_original] = {
                        nome_decifrado: item.nome_decifrado,
                        categoria_principal: item.categoria_principal, // Categoria "palpite" da IA
                        subcategoria: item.subcategoria // Categoria "palpite" da IA
                    };
                    novasDefinicoes++;
                });

                // Salva o arquivo de definição (definição_map.json) atualizado
                if (novasDefinicoes > 0) {
                    try {
                        fs.writeFileSync(DEFINICAO_MAP_PATH, JSON.stringify(categoriasMap, null, 2), 'utf8');
                        console.log(`[Processamento] '${DEFINICAO_MAP_PATH}' foi atualizado com ${novasDefinicoes} novas definições.`);
                    } catch (writeError) {
                        console.error(`[Processamento] ERRO ao salvar '${DEFINICAO_MAP_PATH}': ${writeError.message}`);
                    }
                }
            }
        } else {
            console.log("[Processamento] Todos os produtos foram encontrados no mapa manual. IA não foi necessária.");
        }
        
        // --- 5. MODIFICADO: Enriquecimento final dos produtos ---
        const produtosCompletos = dados.produtos.map(p => {
            // Pega as informações do mapa (seja do arquivo ou da IA)
            const infoMapa = categoriasMap[p.nome];
            
            const nome_decifrado = infoMapa ? infoMapa.nome_decifrado : p.nome;
            
            // Define categorias padrão (baseadas no palpite da IA ou 'Desconhecida')
            let categoria_principal = infoMapa ? infoMapa.categoria_principal : 'Desconhecida';
            let subcategoria = infoMapa ? infoMapa.subcategoria : 'N/A';

            // NOVO: Sobrescreve as categorias com o CATMAT
            // Busca o nome decifrado no mapa CATMAT
            const nomeUpper = nome_decifrado.toUpperCase();
            for (const keyword of sortedCatmatKeys) {
                if (nomeUpper.includes(keyword)) {
                    const catmatInfo = catmatMap[keyword];
                    categoria_principal = catmatInfo.grupo; // Sobrescreve
                    subcategoria = catmatInfo.categoria; // Sobrescreve
                    break; // Para na primeira (mais longa) correspondência
                }
            }

            return {
                ...p,
                nome_decifrado: nome_decifrado,
                categoria_principal: categoria_principal,
                subcategoria: subcategoria
            };
        });

        // 6. Atualiza o db.json (banco de dados principal)
        atualizarDbJson(dados.supermercado, produtosCompletos); 
        
    } catch (error) {
        console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
        console.error(error.message);
        console.error("-------------------------------------------------");
        process.exit(1);
    }
}

// Inicia o processo
main();