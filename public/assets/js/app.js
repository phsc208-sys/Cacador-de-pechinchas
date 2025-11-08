// URL principal da API para supermercados (o seu json-server)
const API_URL = "http://localhost:3000/supermercados";

// Array temporário para guardar produtos ao criar/editar um supermercado
let produtosTemporarios = [];

/**
 * Event listener principal que corre quando o HTML está pronto.
 * Decide quais funções executar com base na página atual.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Funções da página inicial (index.html)
  if (document.getElementById("destaquesContainer")) {
    montarDestaques();
    montarListaSupermercados();
  }

  // Funções da página de detalhe (detalhe.html)
  if (document.getElementById("detalheContainer")) {
    montarDetalhes();
  }
  
  // Funções da página de cadastro (cadastro.html)
  if (document.getElementById("form-supermercado")) {
    configurarFormulario();
  }
  
  // Botão para ir para a página de cadastro
  const btnAdicionar = document.getElementById("btn-adicionar");
  if(btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      window.location.href = "cadastro.html";
    });
  }
  
  // Botão para voltar ao início
  const btnInicio = document.getElementById("btn-inicio");
  if(btnInicio) {
    btnInicio.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // --- NOVO: Botão de Importar NF ---
  // Procura o botão de importar que adicionámos ao index.html
  const btnImportar = document.getElementById("btn-importar-nf");
  if (btnImportar) {
    // Adiciona o event listener para chamar a nova função
    btnImportar.addEventListener("click", handleImportarNF);
  }
  // --- FIM DO NOVO ---
});

// --- NOVA FUNÇÃO PARA IMPORTAR NF ---
/**
 * Chamada quando o botão "Importar" é clicado.
 * Pega a chave da NF e envia para o nosso backend (server.js)
 */
async function handleImportarNF() {
  const input = document.getElementById("input-chave-nf");
  const chave = input.value.trim();

  if (!chave) {
    alert("Por favor, cole a chave da NF no campo de texto.");
    return;
  }

  const btn = document.getElementById("btn-importar-nf");
  btn.disabled = true;
  btn.textContent = "Importando...";

  try {
    // Faz um POST para a nossa nova rota customizada /importar-nf
    const response = await fetch('/importar-nf', { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chave: chave }), // Envia a chave para o backend
    });

    if (!response.ok) {
      // Se o backend der um erro (ex: scraping falhou), mostra aqui
      const erro = await response.json();
      throw new Error(erro.detalhes || "Falha ao importar.");
    }

    const novoSupermercado = await response.json();
    alert(`Supermercado "${novoSupermercado.nome}" importado com sucesso!`);
    
    // Limpa o campo e recarrega a lista de supermercados
    input.value = "";
    if (document.getElementById("supermercadosContainer")) {
      montarListaSupermercados(); // Atualiza a lista da página inicial
    }

  } catch (error) {
    console.error(error);
    alert(`Erro ao importar: ${error.message}`);
  } finally {
    // Reativa o botão, quer tenha dado certo ou errado
    btn.disabled = false;
    btn.textContent = "Importar";
  }
}
// --- FIM DA NOVA FUNÇÃO ---


// --- Resto do seu código original ---

/**
 * Busca supermercados com "destaque=true" e monta o carrossel
 */
async function montarDestaques() {
  const container = document.getElementById("destaquesContainer");
  
  try {
    const response = await fetch(`${API_URL}?destaque=true`);
    if (!response.ok) throw new Error("Erro ao buscar destaques.");
    
    const destaques = await response.json();
    
    container.innerHTML = ""; 
    destaques.forEach((s, index) => {
      const active = index === 0 ? "active" : "";
      container.innerHTML += `
        <div class="carousel-item ${active}">
          <img src="${s.imagem}" class="d-block w-100" alt="${s.nome}">
          <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
            <h5>${s.nome}</h5>
            <p>${s.cidade}</p>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Não foi possível carregar os destaques.</p>";
  }
}

/**
 * Busca todos os supermercados e monta os cards
 */
async function montarListaSupermercados() {
  const container = document.getElementById("supermercadosContainer");
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar supermercados.");
    
    const supermercados = await response.json();
    
    container.innerHTML = ""; 
    supermercados.forEach(s => {
      container.innerHTML += `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <img src="${s.imagem}" class="card-img-top" alt="${s.nome}">
            <div class="card-body">
              <h5 class="card-title">${s.nome}</h5>
              <p class="card-text">${s.cidade} - ${s.endereco}</p>
              <a href="detalhe.html?id=${s.id}" class="btn btn-primary">Detalhes</a>
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Não foi possível carregar os supermercados.</p>";
  }
}

/**
 * Busca um supermercado específico pelo ID (da URL) e mostra os detalhes
 */
async function montarDetalhes() {
  const container = document.getElementById("detalheContainer");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = "<p>ID do supermercado não fornecido!</p>";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Supermercado não encontrado.");
    
    const s = await response.json();
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>${s.nome}</h2>
        <div>
          <a href="cadastro.html?id=${s.id}" class="btn btn-success">Editar</a>
          <button id="btn-excluir" class="btn btn-danger">Excluir</button>
        </div>
      </div>
      <p><strong>Cidade:</strong> ${s.cidade}</p>
      <p><strong>Endereço:</strong> ${s.endereco}</p>
      <p><strong>Telefone:</strong> ${s.telefone}</p>
      <img src="${s.imagem}" alt="${s.nome}" class="img-fluid mb-4">
      <h3>Produtos</h3>
      <div class="row">
        ${s.produtos.map(p => `
          <div class="col-md-4 mb-3">
            <div class="card h-100">
              <img src="${p.imagem}" class="card-img-top" alt="${p.nome}">
              <div class="card-body">
                <h5 class="card-title">${p.nome}</h5>
                <p class="card-text">${p.descricao}</p>
                <p><strong>Preço:</strong> ${p.preco}</p>
                <p><strong>Marca:</strong> ${p.marca}</p>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Adiciona o listener para o botão de excluir
    document.getElementById("btn-excluir").addEventListener("click", () => handleExcluir(id));

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>${error.message}</p>`;
  }
}

/**
 * Prepara o formulário de cadastro, seja para criar um novo ou editar um existente
 */
async function configurarFormulario() {
  const form = document.getElementById("form-supermercado");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // Listener do botão "Adicionar Produto"
  document.getElementById("btn-add-produto").addEventListener("click", adicionarProdutoTemporario);

  // Se tem um ID na URL, estamos a EDITAR
  if (id) {
    document.querySelector("header h1").textContent = "Editar Supermercado";
    document.querySelector("button[type='submit']").textContent = "Salvar Alterações";
    
    try {
      // Busca os dados atuais do supermercado
      const response = await fetch(`${API_URL}/${id}`);
      const data = await response.json();

      // Preenche o formulário
      document.getElementById("sup-nome").value = data.nome;
      document.getElementById("sup-cidade").value = data.cidade;
      document.getElementById("sup-endereco").value = data.endereco;
      document.getElementById("sup-telefone").value = data.telefone;
      document.getElementById("sup-img").value = data.imagem;
      document.getElementById("sup-destaque").checked = data.destaque;
      
      // Adiciona o ID num campo escondido
      const idInput = document.createElement('input');
      idInput.type = "hidden";
      idInput.id = "sup-id";
      idInput.value = id;
      form.prepend(idInput);

      // Carrega os produtos existentes para o array temporário
      produtosTemporarios = data.produtos || [];
      renderizarProdutosTemporarios();

      // Muda o submit do formulário para a função de UPDATE
      form.addEventListener("submit", handleUpdate);

    } catch (error) {
      console.error("Erro ao carregar dados para edição:", error);
    }

  } else {
    // Se não tem ID, estamos a CRIAR
    // Muda o submit do formulário para a função de CREATE
    form.addEventListener("submit", handleCreate);
  }
}

/**
 * Adiciona um produto ao array 'produtosTemporarios' (ainda não salva no db.json)
 */
function adicionarProdutoTemporario() {
  const produto = {
    nome: document.getElementById("prod-nome").value,
    descricao: document.getElementById("prod-desc").value,
    preco: document.getElementById("prod-preco").value,
    marca: document.getElementById("prod-marca").value,
    imagem: document.getElementById("prod-img").value,
  };

  if (!produto.nome || !produto.preco) {
    alert("Nome e Preço do produto são obrigatórios.");
    return;
  }

  produtosTemporarios.push(produto);
  renderizarProdutosTemporarios(); // Atualiza a lista visual
  
  // Limpa os campos de produto
  document.getElementById("prod-nome").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-preco").value = "";
  document.getElementById("prod-marca").value = "";
  document.getElementById("prod-img").value = "";
}

/**
 * Mostra os produtos do array 'produtosTemporarios' na página de cadastro
 */
function renderizarProdutosTemporarios() {
  const container = document.getElementById("produtos-adicionados");
  container.innerHTML = "";
  
  if(produtosTemporarios.length === 0) {
    container.innerHTML = "<p>Nenhum produto adicionado.</p>";
    return;
  }
  
  produtosTemporarios.forEach((prod, index) => {
    container.innerHTML += `
      <div class="card card-body mb-2">
        <strong>${prod.nome}</strong> - ${prod.preco}
        <button type"button" class="btn btn-sm btn-danger mt-1" onclick="removerProdutoTemporario(${index})">Remover</button>
      </div>
    `;
  });
}

/**
 * Remove um produto do array 'produtosTemporarios' (acessível globalmente)
 * @param {number} index - O índice do produto a remover
 */
window.removerProdutoTemporario = function(index) {
  produtosTemporarios.splice(index, 1); 
  renderizarProdutosTemporarios(); 
}

/**
 * Envia o novo supermercado (com os produtos temporários) para a API (POST)
 */
async function handleCreate(event) {
  event.preventDefault(); // Impede o formulário de recarregar a página

  // Monta o objeto final
  const supermercado = {
    nome: document.getElementById("sup-nome").value,
    cidade: document.getElementById("sup-cidade").value,
    endereco: document.getElementById("sup-endereco").value,
    telefone: document.getElementById("sup-telefone").value,
    imagem: document.getElementById("sup-img").value,
    destaque: document.getElementById("sup-destaque").checked,
    produtos: produtosTemporarios 
  };

  try {
    // Envia para o json-server
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermercado),
    });

    if (!response.ok) throw new Error("Erro ao cadastrar supermercado.");

    alert("Supermercado cadastrado com sucesso!");
    produtosTemporarios = []; // Limpa o array
    window.location.href = "index.html"; // Redireciona para o início

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

/**
 * Envia os dados atualizados do supermercado para a API (PUT)
 */
async function handleUpdate(event) {
  event.preventDefault(); 
  const id = document.getElementById("sup-id").value;
  
  // Monta o objeto final
  const supermercado = {
    nome: document.getElementById("sup-nome").value,
    cidade: document.getElementById("sup-cidade").value,
    endereco: document.getElementById("sup-endereco").value,
    telefone: document.getElementById("sup-telefone").value,
    imagem: document.getElementById("sup-img").value,
    destaque: document.getElementById("sup-destaque").checked,
    produtos: produtosTemporarios 
  };
  
  try {
    // Envia para o json-server (note a URL com o ID)
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermercado),
    });

    if (!response.ok) throw new Error("Erro ao atualizar supermercado.");

    alert("Supermercado atualizado com sucesso!");
    produtosTemporarios = []; 
    window.location.href = `detalhe.html?id=${id}`; // Redireciona para a página de detalhes

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

/**
 * Envia um pedido para apagar um supermercado da API (DELETE)
 */
async function handleExcluir(id) {
  // O confirm() é do seu código original, mantive.
  if (!confirm("Tem certeza que deseja excluir este supermercado?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) throw new Error("Erro ao excluir supermercado.");
    
    alert("Supermercado excluído com sucesso!");
    window.location.href = "index.html"; // Redireciona para o início
    
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}