// --- CONSTANTES E VARIÁVEIS GLOBAIS ---
const API_URL = "http://localhost:3000/supermercados";

let todosProdutos = []; // Armazena TODOS os produtos da API
let todosSupermercados = []; // Armazena nomes dos supermercados

// Instâncias dos Gráficos (para poderem ser destruídas e recriadas)
let graficoBarras = null;
let graficoPizza = null;

// Elementos de Filtro
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroSubcategoria = document.getElementById("filtro-subcategoria");
const filtroPdm = document.getElementById("filtro-pdm");
const btnLimpar = document.getElementById("btn-limpar-filtros");

// Elementos de Loading
const loadingBar = document.getElementById("loading-bar");
const loadingPie = document.getElementById("loading-pie");

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("graficoPrecoMedio")) {
    iniciarDashboard();
  }
});

/**
 * Função principal que busca dados e configura a página.
 */
async function iniciarDashboard() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar supermercados.");
    
    const supermercados = await response.json();
    
    // Processa e armazena os dados globalmente
    supermercados.forEach(s => {
      todosSupermercados.push(s.nome); // Guarda nome do supermercado
      if (s.produtos && s.produtos.length > 0) {
        s.produtos.forEach(p => {
          // Adiciona o nome do supermercado a cada produto
          p.supermercadoNome = s.nome; 
          todosProdutos.push(p);
        });
      }
    });

    if (todosProdutos.length === 0) {
        loadingBar.textContent = "Nenhum produto cadastrado na base de dados.";
        loadingPie.textContent = "Nenhum produto cadastrado na base de dados.";
        return;
    }

    // Configura os listeners dos filtros
    configurarListeners();
    
    // Popula o primeiro filtro (Categorias)
    popularFiltros('categoria_principal', filtroCategoria);
    
    // Desenha os gráficos com os dados totais (sem filtro)
    atualizarGraficos();

  } catch (error) {
    console.error(error);
    loadingBar.textContent = "Falha ao carregar dados.";
    loadingPie.textContent = "Falha ao carregar dados.";
  }
}

// --- LÓGICA DE FILTROS ---

/**
 * Adiciona os Event Listeners aos seletores <select>.
 */
function configurarListeners() {
  // 1. Quando muda a Categoria
  filtroCategoria.addEventListener("change", () => {
    const categoria = filtroCategoria.value;
    
    // Habilita/desabilita e popula o filtro de Subcategoria
    if (categoria) {
      popularFiltros('subcategoria', filtroSubcategoria, { categoria_principal: categoria });
      filtroSubcategoria.disabled = false;
    } else {
      filtroSubcategoria.innerHTML = '<option value="">Todas as Subcategorias</option>';
      filtroSubcategoria.disabled = true;
    }
    // Reseta o filtro PDM
    filtroPdm.innerHTML = '<option value="">Todos os Materiais</option>';
    filtroPdm.disabled = true;
    
    // Atualiza os gráficos
    atualizarGraficos();
  });

  // 2. Quando muda a Subcategoria
  filtroSubcategoria.addEventListener("change", () => {
    const categoria = filtroCategoria.value;
    const subcategoria = filtroSubcategoria.value;

    // Habilita/desabilita e popula o filtro PDM
    if (subcategoria) {
      popularFiltros('Pdm', filtroPdm, { categoria_principal: categoria, subcategoria: subcategoria });
      filtroPdm.disabled = false;
    } else {
      filtroPdm.innerHTML = '<option value="">Todos os Materiais</option>';
      filtroPdm.disabled = true;
    }
    
    // Atualiza os gráficos
    atualizarGraficos();
  });

  // 3. Quando muda o PDM
  filtroPdm.addEventListener("change", () => {
    atualizarGraficos();
  });

  // 4. Botão de Limpar
  btnLimpar.addEventListener("click", () => {
    filtroCategoria.value = "";
    filtroSubcategoria.value = "";
    filtroSubcategoria.innerHTML = '<option value="">Todas as Subcategorias</option>';
    filtroSubcategoria.disabled = true;
    filtroPdm.value = "";
    filtroPdm.innerHTML = '<option value="">Todos os Materiais</option>';
    filtroPdm.disabled = true;
    
    atualizarGraficos();
  });
}

/**
 * Popula um <select> com valores únicos de `todosProdutos`.
 * @param {string} campo - O campo do produto (ex: 'categoria_principal').
 * @param {HTMLElement} selectElement - O elemento <select> a ser populado.
 * @param {object} [filtrosAnteriores={}] - Filtros das etapas anteriores (para cascata).
 */
function popularFiltros(campo, selectElement, filtrosAnteriores = {}) {
  // Filtra os produtos com base nos filtros anteriores
  let produtosFiltrados = todosProdutos.filter(p => {
    for (const key in filtrosAnteriores) {
      if (p[key] !== filtrosAnteriores[key]) {
        return false;
      }
    }
    return true;
  });

  // Pega valores únicos do campo desejado
  const valoresUnicos = [...new Set(produtosFiltrados.map(p => p[campo]).filter(Boolean))];
  valoresUnicos.sort();

  // Popula o <select>
  selectElement.innerHTML = `<option value="">Todos(as) ${selectElement.labels[0].textContent.split(" ")[1]}</option>`; // Reseta
  valoresUnicos.forEach(valor => {
    if (valor !== 'N/A') {
      const option = document.createElement('option');
      option.value = valor;
      option.textContent = valor;
      selectElement.appendChild(option);
    }
  });
}

// --- LÓGICA DE ATUALIZAÇÃO DOS GRÁFICOS ---

/**
 * Filtra os produtos com base nos seletores e chama as funções de desenho.
 */
function atualizarGraficos() {
  const filtros = {
    categoria_principal: filtroCategoria.value,
    subcategoria: filtroSubcategoria.value,
    Pdm: filtroPdm.value
  };

  // Filtra a lista principal de produtos
  const produtosFiltrados = todosProdutos.filter(p => {
    return Object.keys(filtros).every(key => {
      // Se o filtro não foi selecionado (ex: "Todos"), não filtra por ele
      if (!filtros[key]) {
        return true; 
      }
      // Se foi selecionado, verifica se o produto bate com o filtro
      return p[key] === filtros[key];
    });
  });

  // Atualiza os dois gráficos com os produtos filtrados
  desenharGraficoBarras(produtosFiltrados);
  desenharGraficoPizza(produtosFiltrados, filtros);
}

/**
 * Limpa e desenha o Gráfico de Barras (Preço Médio).
 * @param {Array} produtos - A lista de produtos já filtrada.
 */
function desenharGraficoBarras(produtos) {
  const ctx = document.getElementById('graficoPrecoMedio').getContext('2d');
  
  if (graficoBarras) {
    graficoBarras.destroy(); // Destrói o gráfico anterior
  }

  const dadosGrafico = {
    labels: [],
    datasets: [{
      label: 'Preço Médio (R$)',
      data: [],
      backgroundColor: '#e9710f',
      borderColor: '#252525',
      borderWidth: 1
    }]
  };

  if (produtos.length === 0) {
      loadingBar.textContent = "Nenhum produto encontrado com esses filtros.";
      // Desenha um gráfico vazio
      graficoBarras = new Chart(ctx, { type: 'bar', data: dadosGrafico });
      return;
  }

  // Agrupa produtos por supermercado e calcula a média
  const precosPorSupermercado = {}; // { "Supermercado A": { soma: 100, qtd: 10 }, ... }
  
  produtos.forEach(p => {
    const preco = parsePreco(p.preco_unidade || p.preco);
    if (preco === null) return; // Ignora se o preço não for válido
    
    const sNome = p.supermercadoNome;
    if (!precosPorSupermercado[sNome]) {
      precosPorSupermercado[sNome] = { soma: 0, qtd: 0 };
    }
    precosPorSupermercado[sNome].soma += preco;
    precosPorSupermercado[sNome].qtd++;
  });

  // Prepara os dados para o Chart.js
  const supermercadosOrdenados = Object.keys(precosPorSupermercado).sort();
  
  supermercadosOrdenados.forEach(nome => {
    const dados = precosPorSupermercado[nome];
    if (dados.qtd > 0) {
      const media = dados.soma / dados.qtd;
      dadosGrafico.labels.push(nome);
      dadosGrafico.datasets[0].data.push(media.toFixed(2));
    }
  });
  
  loadingBar.textContent = ""; // Limpa a mensagem de loading/erro
  
  // Desenha o novo gráfico
  graficoBarras = new Chart(ctx, {
    type: 'bar',
    data: dadosGrafico,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { callback: valor => formatarComoReais(valor) } }
      },
      plugins: {
        tooltip: { callbacks: { label: ctx => formatarTooltipReais(ctx) } }
      }
    }
  });
}

/**
 * Limpa e desenha o Gráfico de Pizza (Distribuição).
 * @param {Array} produtos - A lista de produtos já filtrada.
 * @param {object} filtros - O estado atual dos filtros.
 */
function desenharGraficoPizza(produtos, filtros) {
  const ctx = document.getElementById('graficoDistribuicao').getContext('2d');
  
  if (graficoPizza) {
    graficoPizza.destroy(); // Destrói o gráfico anterior
  }
  
  if (produtos.length === 0) {
      loadingPie.textContent = "Nenhum produto encontrado com esses filtros.";
      // Desenha um gráfico vazio
      graficoPizza = new Chart(ctx, { type: 'pie', data: {} });
      return;
  }
  
  // Lógica de qual campo mostrar no Gráfico de Pizza:
  // 1. Se filtro PDM está ativo, não mostra o pizza.
  // 2. Se filtro Subcategoria está ativo, mostra distribuição de PDM.
  // 3. Se filtro Categoria está ativo, mostra distribuição de Subcategoria.
  // 4. Se nenhum filtro está ativo, mostra distribuição de Categoria.
  let campoPizza = 'categoria_principal';
  if (filtros.Pdm) {
      loadingPie.textContent = "Distribuição não aplicável no nível de PDM.";
      graficoPizza = new Chart(ctx, { type: 'pie', data: {} });
      return;
  } else if (filtros.subcategoria) {
      campoPizza = 'Pdm';
  } else if (filtros.categoria_principal) {
      campoPizza = 'subcategoria';
  }
  
  // Conta as ocorrências
  const contagem = {}; // { "Bebidas": 10, "Laticínios": 5, ... }
  produtos.forEach(p => {
    const valor = p[campoPizza] || 'Indefinido';
    if (valor === 'N/A') return; // Ignora N/A
    
    contagem[valor] = (contagem[valor] || 0) + 1;
  });

  const labels = Object.keys(contagem);
  const data = Object.values(contagem);

  loadingPie.textContent = ""; // Limpa mensagem
  
  // Desenha o novo gráfico
  graficoPizza = new Chart(ctx, {
    type: 'pie', // 'pie' ou 'doughnut'
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade de Itens',
        data: data,
        // Gera cores aleatórias (opcional, pode definir uma paleta fixa)
        backgroundColor: ['#e9710f', '#252525', '#ffcc80', '#6c757d', '#198754', '#0d6efd'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      }
    }
  });
}

// --- FUNÇÕES UTILITÁRIAS ---

/**
 * Converte uma string de preço (ex: "R$ 10,90") para um número (10.90).
 * @param {string} precoString
 * @returns {number | null}
 */
function parsePreco(precoString) {
  if (!precoString) return null;
  
  const precoNumerico = parseFloat(
    precoString.replace("R$", "").trim().replace(".", "").replace(",", ".")
  );
  
  return isNaN(precoNumerico) ? null : precoNumerico;
}

/**
* Formata um valor numérico para Reais (para Eixos do Gráfico).
*/
function formatarComoReais(valor) {
  return 'R$ ' + valor.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
* Formata um valor numérico para Reais (para Tooltips do Gráfico).
*/
function formatarTooltipReais(context) {
  let label = context.dataset.label || '';
  if (label) {
    label += ': ';
  }
  if (context.parsed.y !== null) {
    label += formatarComoReais(context.parsed.y);
  }
  return label;
}