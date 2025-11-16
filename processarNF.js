// processarNF.js (Modo HÍBRIDO: Mapeamento Manual + Fallback IA para Produtos E Coordenadas)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

// --- Configuração de Caminhos ---
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const NF_HTML_PATH = path.join(__dirname, 'pagina_nf.html');
const DEFINICAO_MAP_PATH = path.join(__dirname, 'db', 'definição_map.json');

// --- Configuração da IA ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const API_KEY = "AIzaSyCmkJ0nkvtNOebCc2E5CDnM_V2l2UtAQBY"; // Sua chave API (MANTENHA PRIVADA)

// Lista de Grupos (categorias principais) válidos do CATMAT
const GRUPOS_CATMAT_VALIDOS = [
    "ARMAMENTO", "MATERIAIS BÉLICOS NUCLEARES", "EQUIPAMENTOS DE TIRO", 
    "MUNIÇÕES E EXPLOSIVOS", "MÍSSEIS GUIADOS", "AERONAVES E SEUS COMPONENTES ESTRUTURAIS",
    "COMPONENTES E ACESSORIOS DE AERONAVES", "EQUIPAMENTOS PARA LANCAMENTOS, POUSO E MANOBRA DE AERONAVES",
    "VEICULOS ESPACIAIS (ASTRONAVES)", "NAVIOS, PEQUENAS EMBARCACOES, PONTOES E DIQUES FLUTUANTES",
    "EQUIPAMENTOS PARA NAVIOS E EMBARCACOES", "EQUIPAMENTOS FERROVIÁRIOS", "VEíCULOS", 
    "TRATORES", "COMPONENTES DE VEÍCULOS", "PNEUS E CÂMARAS DE AR", "MOTORES, TURBINAS E SEUS COMPONENTES",
    "ACESSÓRIOS DE MOTORES", "EQUIPAMENTOS DE TRANSMISSÃO DE FORÇA MECÂNICA", "ROLAMENTOS E MANCAIS",
    "MÁQUINAS E EQUIPAMENTOS PARA TRABALHOS EM MADEIRA", "MAQUINAS PARA TRABALHO EM METAIS",
    "EQUIPAMENTOS COMERCIAIS E DE SERVIÇOS", "MÁQUINAS PARA INDÚSTRIAS ESPECIALIZADAS",
    "MÁQUINAS E EQUIPAMENTOS AGRÍCOLAS", "EQUIPAMENTOS PARA CONSTRUÇÃO, MINERAÇÃO, TERRAPLENAGEM E MANUTENÇÃO DE ESTRADAS",
    "EQUIPAMENTOS PARA MANUSEIO DE MATERIAL", "CORDAS, CABOS, CORRENTES E SEUS ACESSÓRIOS",
    "EQUIPAMENTOS PARA REFRIGERAÇÃO, AR CONDICIONADO E CIRCULAÇÃODE AR", 
    "EQUIPAMENTO PARA COMBATE A INCÊNDIO, RESGATE E SEGURANÇA", "BOMBAS E COMPRESSORES",
    "FORNOS, CENTRAIS DE VAPOR E EQUIPAMENTOS DE SECAGEM, REATORES NUCLEARES",
    "EQUIPAMENTO DE INSTALAÇÕES HIDRÁULICAS E DE AQUECIMENTO", 
    "EQUIPAMENTOS PARA PURIFICAÇÃO DE ÁGUAS E TRATAMENTO DE ESGOTOS", "CANOS, TUBOS, MANGUEIRAS E ACESSÓRIOS",
    "VÁLVULAS", "EQUIPAMENTOS PARA OFICINAS DE MANUTENÇÃO E REPAROS", "FERRAMENTAS MANUAIS",
    "INSTRUMENTOS DE MEDIÇÃO", "FERRAGENS E ABRASIVOS", "ESTRUTURAS E ANDAIMES PRÉ-FABRICADOS",
    "TÁBUAS, ESQUADRIAS, COMPENSADOS E FOLHEADOS DE MADEIRA", "MATERIAIS PARA CONSTRUÇÃO",
    "EQUIPAMENTOS DE COMUNICAÇÕES, DETEÇÃO E RADIAÇÃO COERENTE", 
    "COMPONENTES DE EQUIPAMENTOS ELÉTRICOS E ELETRÔNICOS",
    "MATERIAIS, COMPONENTES, CONJUNTOS E ACESSÓRIOS DE FIBRAS ÓTICAS",
    "CONDUTORES ELÉTRICOS E EQUIPAMENTOS PARA GERAÇÃO E DISTRIBUIÇÃO DE ENERGIA",
    "EQUIPAMENTOS DE ILUMINAÇÃO E LÂMPADAS", "SISTEMAS DE ALARME, SINALIZAÇÃO E DETECÇÃO PARA SEGURANÇA",
    "MEDICAMENTOS, DROGAS E PRODUTOS BIOLOGICOS", "EQUIPAMENTOS E ARTIGOS PARA USO MÉDICO, DENTÁRIO E VETERINÁRIO",
    "INSTRUMENTOS E EQUIPAMENTOS DE LABORATÓRIO", "EQUIPAMENTOS FOTOGRÁFICOS",
    "SUBSTÂNCIAS E PRODUTOS QUÍMICOS", "APARELHOS E ACESSÓRIOS PARA TREINAMENTO",
    "INFORMÁTICA - EQUIPAMENTOS, PEÇAS, ACESSÓRIOS E SUPRIMENTOSDE TIC", "MOBILIÁRIOS",
    "UTENSILIOS E UTILIDADES DE USO DOMESTICO E COMERCIAL", "EQUIPAMENTOS PARA PREPARAR E SERVIR ALIMENTOS",
    "MÁQUINAS PARA ESCRITÓRIO, SISTEMAS DE PROCESSAMENTO DE TEXTO E FICHÁRIOS DE CLASSIFICAÇÃO VISÍVEL",
    "UTENSÍLIOS DE ESCRITÓRIO E MATERIAL DE EXPEDIENTE", "LIVROS, MAPAS E OUTRAS PUBLICAÇÕES",
    "INSTRUMENTOS MUSICAIS, FONÓGRAFOS E RÁDIOS DOMÉSTICOS", "EQUIPAMENTOS PARA RECREAÇÃO E DESPORTOS",
    "EQUIPAMENTOS E MATERIAIS PARA LIMPEZA", "PINCÉIS, TINTAS, VEDANTES E ADESIVOS",
    "RECIPIENTES E MATERIAIS PARA ACONDICIONAMENTO E EMBALAGEM", "TECIDOS, COUROS, PELES, AVIAMENTOS, BARRACAS E BANDEIRAS",
    "VESTUÁRIOS, EQUIPAMENTOS INDIVIDUAIS E INSÍGNIAS", "ARTIGOS DE HIGIENE", "SUPRIMENTOS AGRÍCOLAS",
    "ANIMAIS VIVOS", "SUBSISTÊNCIA", "COMBUSTÍVEIS, LUBRIFICANTES, ÓLEOS E CERAS",
    "MATERIAIS MANUFATURADOS, NÃO METÁLICOS", "MATÉRIAS-PRIMAS NAO METÁLICAS",
    "BARRAS, CHAPAS E PERFILADOS METÁLICOS", "MINÉRIOS, MINERAIS E SEUS PRODUTOS PRIMÁRIOS", "DIVERSOS"
];


// --- FUNÇÃO DA IA (Categorização de Produtos) ---
async function categorizarProdutosComIA(produtos) {
    if (produtos.length === 0) return null;
    
    const nomesAbreviados = produtos.map(p => p.nome);
    const userQuery = `Decifre e categorize os seguintes nomes de produtos abreviados de notas fiscais de supermercado:
    
    Nomes para processar: ${nomesAbreviados.join('; ')}`;

    const systemPrompt = `Você é um especialista em decifração de abreviações de produtos e sua tarefa é categorizar itens no padrão CATMAT.
    
    Para cada nome abreviado, você deve:
    1.  Decifrar o nome completo do produto (Ex: 'LTE L V CAM INT 1L' -> 'Leite Longa Vida Integral Camponesa 1 Litro').
    2.  Identificar o PDM (Produto/Descrição de Material) genérico desse item (Ex: "LEITE" ou "IOGURTE").
    3.  Associar o PDM ao "Grupo" (categoria_principal) e "Categoria" (subcategoria) corretos, conforme a estrutura do CATMAT.
        
        **IMPORTANTE:** O "Grupo" (categoria_principal) DEVE SER ESTRITAMENTE UM dos seguintes valores:
        [${GRUPOS_CATMAT_VALIDOS.join(', ')}]
        
        **Exemplos de Mapeamento:**
        -   "Iogurte Itambé..." -> PDM: "IOGURTE", Grupo: "SUBSISTÊNCIA", Categoria: "OVOS E LATICÍNIOS".
        -   "Leite Camponesa..." -> PDM: "LEITE", Grupo: "SUBSISTÊNCIA", Categoria: "OVOS E LATICÍNIOS".
        -   "Sabão em Pó Omo" -> PDM: "SABÃO PÓ", Grupo: "EQUIPAMENTOS E MATERIAIS PARA LIMPEZA", Categoria: "COMPOSTOS E PREPARADOS PARA LIMPEZA E POLIMENTO".
    
    A saída DEVE ser um array JSON de objetos, seguindo este schema exato:
    -   "nome_original": O nome abreviado (Ex: "IOG ITAM PED COC 450")
    -   "nome_decifrado": O nome completo (Ex: "Iogurte Itambé com Pedaços de Coco 450g")
    -   "categoria_principal": O Grupo do CATMAT (Ex: "SUBSISTÊNCIA")
    -   "subcategoria": A Categoria do CATMAT (Ex: "OVOS E LATICÍNIOS")
    -   "Pdm": O PDM genérico (Ex: "IOGURTE")
    `;

    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "nome_original": { "type": "STRING" },
                "nome_decifrado": { "type": "STRING" },
                "categoria_principal": { "type": "STRING" },
                "subcategoria": { "type": "STRING" },
                "Pdm": { "type": "STRING" }
            },
            required: ["nome_original", "nome_decifrado", "categoria_principal", "subcategoria", "Pdm"],
            propertyOrdering: ["nome_original", "nome_decifrado", "categoria_principal", "subcategoria", "Pdm"]
        }
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    return await fazerChamadaIA(payload, "Categorização de Produtos");
}

// --- NOVA FUNÇÃO DA IA (Geocodificação de Endereço) ---
async function obterCoordenadasComIA(enderecoCompleto) {
    if (!enderecoCompleto) return null;

    const userQuery = `Converta este endereço em coordenadas geográficas: ${enderecoCompleto}`;
    
    const systemPrompt = `Você é um assistente de geocodificação. Sua tarefa é retornar a latitude e longitude de um endereço fornecido.
    A saída DEVE ser um objeto JSON único seguindo este schema exato:
    - "latitude": O valor numérico da latitude (Ex: -19.923)
    - "longitude": O valor numérico da longitude (Ex: -43.9298)
    `;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            "latitude": { "type": "NUMBER" },
            "longitude": { "type": "NUMBER" }
        },
        required: ["latitude", "longitude"]
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    return await fazerChamadaIA(payload, "Geocodificação");
}


// --- FUNÇÃO AUXILIAR GENÉRICA PARA IA ---
async function fazerChamadaIA(payload, nomeTarefa) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            if (!API_KEY || API_KEY === "") {
                console.error(`[IA - ${nomeTarefa}] ERRO: Chave API não configurada. Tarefa pulada.`);
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
            console.warn(`[IA - ${nomeTarefa}] Tentativa ${attempts} falhou: ${error.message}.`);
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            } else {
                console.error(`[IA - ${nomeTarefa}] Todas as tentativas falharam. Prosseguindo sem dados da IA.`);
                return null; 
            }
        }
    }
}


// --- Função de Extração (igual a antes) ---
function extrairDadosNF(html) {
    const $ = cheerio.load(html);
    
    const nomeSupermercadoRaw = $('th.text-center.text-uppercase h4 b').text().trim();
    const nomeSupermercado = nomeSupermercadoRaw.split('COMERCIO')[0].split('LTDA')[0].trim(); 
    
    const infoSupermercado = $('table.table tbody tr:nth-child(1) td').text().trim();
    const cnpjMatch = infoSupermercado.match(/CNPJ:\s*(\d+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].replace(/[\.-]/g, '').trim() : null; 

    const enderecoCompleto = $('table.table tbody tr:nth-child(2) td').text().trim();
    const partes = enderecoCompleto.split(', ');
    const uf = partes[partes.length - 1]; // Ex: MG
    const cepCidade = partes[partes.length - 2]; // Ex: 3106200 - BELO HORIZONTE
    const cidade = cepCidade ? cepCidade.split(' - ')[1] : 'N/A';
    const enderecoFormatado = partes.slice(0, partes.length - 2).join(', ').trim(); // Pega o resto
    
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
            endereco: `${enderecoFormatado}, ${cidade}, ${uf}`, // Endereço completo para geocodificação
            telefone: 'N/A', 
            imagem: `assets/img/${nomeSupermercado.toLowerCase().replace(/ /g, '')}.jpg`, 
            destaque: false,
        },
        produtos: produtos
    };
}


// --- Função de Atualizar o DB (MODIFICADA para receber coordenadas) ---
function atualizarDbJson(dadosSupermercado, coordenadas, produtosCompletos) {
    try {
        const dbConteudo = fs.readFileSync(DB_PATH, 'utf8');
        const db = JSON.parse(dbConteudo);
        const novoSupermercado = dadosSupermercado;
        
        let supermercadoExistente = db.supermercados.find(s => s.cnpj === novoSupermercado.cnpj);
        if (!supermercadoExistente) {
            supermercadoExistente = db.supermercados.find(s => s.nome.toLowerCase() === novoSupermercado.nome.toLowerCase());
        }

        if (!supermercadoExistente) {
            const newId = Math.random().toString(36).substring(2, 6);
            novoSupermercado.id = newId;
            novoSupermercado.produtos = []; 
            if (coordenadas) { // Adiciona coordenadas se foram encontradas
                novoSupermercado.latitude = coordenadas.latitude;
                novoSupermercado.longitude = coordenadas.longitude;
            }
            db.supermercados.push(novoSupermercado);
            supermercadoExistente = novoSupermercado;
            console.log(`\n[Processamento] Adicionado novo supermercado (ID: ${newId}): ${supermercadoExistente.nome}`);
        } else {
            console.log(`\n[Processamento] Supermercado encontrado (CNPJ: ${supermercadoExistente.cnpj}): ${supermercadoExistente.nome}`);
            // Atualiza dados se necessário
            if (!supermercadoExistente.cnpj && novoSupermercado.cnpj) {
                 supermercadoExistente.cnpj = novoSupermercado.cnpj;
            }
            supermercadoExistente.cidade = novoSupermercado.cidade;
            supermercadoExistente.endereco = novoSupermercado.endereco;

            // Adiciona coordenadas APENAS SE não existirem
            if (coordenadas && !supermercadoExistente.latitude) {
                supermercadoExistente.latitude = coordenadas.latitude;
                supermercadoExistente.longitude = coordenadas.longitude;
                console.log(`[Processamento] Coordenadas (Lat: ${coordenadas.latitude}, Lon: ${coordenadas.longitude}) adicionadas ao supermercado.`);
            }
        }

        let produtosAdicionadosCount = 0;
        if (!supermercadoExistente.produtos || !Array.isArray(supermercadoExistente.produtos)) {
            supermercadoExistente.produtos = [];
        }

        produtosCompletos.forEach(novoProd => {
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
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
        console.log(`[Processamento] Sucesso! O arquivo db.json foi atualizado.`);

    } catch (e) {
        console.error(`[Processamento] ERRO ao atualizar db.json: ${e.message}`);
        process.exit(1);
    }
}


// --- LÓGICA PRINCIPAL (MODIFICADA para chamar as duas IAs) ---
async function main() {
    try {
        if (!fs.existsSync(NF_HTML_PATH)) {
            throw new Error(`ERRO: Arquivo HTML da NF não encontrado em: ${NF_HTML_PATH}`);
        }
        
        // 1. Carregar o definição_map.json
        let categoriasMap = {};
        if (fs.existsSync(DEFINICAO_MAP_PATH)) {
            try {
                categoriasMap = JSON.parse(fs.readFileSync(DEFINICAO_MAP_PATH, 'utf8'));
            } catch (e) {
                console.warn(`[Processamento] Arquivo '${DEFINICAO_MAP_PATH}' parece corrompido. Criando um novo...`);
                categoriasMap = {};
                fs.writeFileSync(DEFINICAO_MAP_PATH, JSON.stringify({}, null, 2), 'utf8');
            }
        } else {
            console.warn(`[Processamento] Arquivo '${DEFINICAO_MAP_PATH}' não encontrado. Criando um novo...`);
            fs.writeFileSync(DEFINICAO_MAP_PATH, JSON.stringify({}, null, 2), 'utf8');
        }

        // 2. Extrair dados da NF (Supermercado e Produtos)
        const dados = extrairDadosNF(fs.readFileSync(NF_HTML_PATH, 'utf8'));
        
        // 3. Identificar produtos que precisam ser decifrados
        const produtosParaIA = dados.produtos.filter(p => !categoriasMap[p.nome]);
        let coordenadas = null;

        // 4. Se houver produtos novos, chamar a IA de Produtos
        if (produtosParaIA.length > 0) {
            console.log(`[IA] ${produtosParaIA.length} produtos não encontrados no mapa. Consultando Gemini para categorizar...`);
            const resultadosIA = await categorizarProdutosComIA(produtosParaIA); 
            
            if (resultadosIA) {
                console.log("[IA] Dados de produtos recebidos. Salvando no definição_map.json...");
                let novasDefinicoes = 0;
                
                for (const item of resultadosIA) {
                    categoriasMap[item.nome_original] = {
                        nome_decifrado: item.nome_decifrado,
                        categoria_principal: item.categoria_principal,
                        subcategoria: item.subcategoria,
                        Pdm: item.Pdm
                    };
                    novasDefinicoes++;
                }

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
            console.log("[Processamento] Todos os produtos já estavam no definição_map.json.");
        }
        
        // 5. Enriquecimento final dos produtos
        const produtosCompletos = dados.produtos.map(p => {
            const infoMapa = categoriasMap[p.nome];
            const nome_decifrado = infoMapa ? infoMapa.nome_decifrado : p.nome;
            const categoria_principal = infoMapa ? infoMapa.categoria_principal : 'Desconhecida';
            const subcategoria = infoMapa ? infoMapa.subcategoria : 'N/A';
            const pdm = infoMapa ? infoMapa.Pdm : 'N/A';

            return { ...p, nome_decifrado, categoria_principal, subcategoria, Pdm: pdm };
        });

        // 6. CHAMADA IA 2: Buscar Coordenadas (apenas se não as tivermos)
        // Precisamos verificar o DB *antes* de chamar a IA
        const dbTemp = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const supermercadoExistente = dbTemp.supermercados.find(s => s.cnpj === dados.supermercado.cnpj);

        if (!supermercadoExistente || !supermercadoExistente.latitude) {
            console.log(`[IA] Supermercado novo ou sem coordenadas. Consultando Gemini para geocodificação do endereço: ${dados.supermercado.endereco}`);
            coordenadas = await obterCoordenadasComIA(dados.supermercado.endereco);
            if(coordenadas) {
                 console.log(`[IA] Coordenadas obtidas: Lat: ${coordenadas.latitude}, Lon: ${coordenadas.longitude}`);
            } else {
                 console.log(`[IA] Não foi possível obter coordenadas para este endereço.`);
            }
        } else {
            console.log("[Processamento] Supermercado já possui coordenadas. Geocodificação pulada.");
        }

        // 7. Atualiza o db.json (banco de dados principal)
        atualizarDbJson(dados.supermercado, coordenadas, produtosCompletos); 
        
    } catch (error) {
        console.error("\n--- ERRO NO PROCESSO DE RASPAGEM E SALVAMENTO ---");
        console.error(error.message);
        console.error("-------------------------------------------------");
        process.exit(1);
    }
}

// Inicia o processo
main();