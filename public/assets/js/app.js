const API_URL = "http://localhost:3000/supermercados";

let produtosTemporarios = [];

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("destaquesContainer")) {
    montarDestaques();
    montarListaSupermercados();
  }

  if (document.getElementById("detalheContainer")) {
    montarDetalhes();
  }

  if (document.getElementById("form-supermercado")) {
    configurarFormulario();
  }

  // NOVO: Inicializa o formulário de importação de NF
  if (document.getElementById("form-importar-nf")) {
    document.getElementById("form-importar-nf").addEventListener("submit", handleImportarNF);
  }

  const btnAdicionar = document.getElementById("btn-adicionar");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      window.location.href = "cadastro.html";
    });
  }

  const btnInicio = document.getElementById("btn-inicio");
  if (btnInicio) {
    btnInicio.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});

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

    document.getElementById("btn-excluir").addEventListener("click", () => handleExcluir(id));

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>${error.message}</p>`;
  }
}

async function configurarFormulario() {
  const form = document.getElementById("form-supermercado");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  document.getElementById("btn-add-produto").addEventListener("click", adicionarProdutoTemporario);

  if (id) {
    document.querySelector("header h1").textContent = "Editar Supermercado";
    document.querySelector("button[type='submit']").textContent = "Salvar Alterações";

    try {
      const response = await fetch(`${API_URL}/${id}`);
      const data = await response.json();

      document.getElementById("sup-nome").value = data.nome;
      document.getElementById("sup-cidade").value = data.cidade;
      document.getElementById("sup-endereco").value = data.endereco;
      document.getElementById("sup-telefone").value = data.telefone;
      document.getElementById("sup-img").value = data.imagem;
      document.getElementById("sup-destaque").checked = data.destaque;

      const idInput = document.createElement('input');
      idInput.type = "hidden";
      idInput.id = "sup-id";
      idInput.value = id;
      form.prepend(idInput);

      produtosTemporarios = data.produtos || [];
      renderizarProdutosTemporarios();

      form.addEventListener("submit", handleUpdate);

    } catch (error) {
      console.error("Erro ao carregar dados para edição:", error);
    }

  } else {
    form.addEventListener("submit", handleCreate);
  }
}

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
  renderizarProdutosTemporarios();

  document.getElementById("prod-nome").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-preco").value = "";
  document.getElementById("prod-marca").value = "";
  document.getElementById("prod-img").value = "";
}

function renderizarProdutosTemporarios() {
  const container = document.getElementById("produtos-adicionados");
  container.innerHTML = "";

  if (produtosTemporarios.length === 0) {
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

window.removerProdutoTemporario = function (index) {
  produtosTemporarios.splice(index, 1);
  renderizarProdutosTemporarios();
}

async function handleCreate(event) {
  event.preventDefault();

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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermercado),
    });

    if (!response.ok) throw new Error("Erro ao cadastrar supermercado.");

    alert("Supermercado cadastrado com sucesso!");
    produtosTemporarios = [];
    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function handleUpdate(event) {
  event.preventDefault();
  const id = document.getElementById("sup-id").value;

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
    window.location.href = `detalhe.html?id=${id}`;

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function handleExcluir(id) {
  if (!confirm("Tem certeza que deseja excluir este supermercado?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Erro ao excluir supermercado.");

    alert("Supermercado excluído com sucesso!");
    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// NOVO: Função para tratar o envio da URL da NF
async function handleImportarNF(event) {
  event.preventDefault();

  const nfURL = document.getElementById("nf-url").value;
  const messageArea = document.getElementById("message-area"); // NOVO: Elemento para mensagens
  const btnSubmit = document.querySelector("#form-importar-nf button[type='submit']");

  messageArea.textContent = ''; // Limpa mensagens anteriores

  if (!nfURL) {
    messageArea.textContent = "A URL da Nota Fiscal é obrigatória.";
    messageArea.style.color = 'red';
    return;
  }

  // Novo: Salva a URL no db.json ANTES de chamar o script de automação
  const API_NF_URL_DB = "http://localhost:3000/urlsNF";
  const API_AUTOMAÇÃO_URL = "http://localhost:3001/api/importar-nf";

  btnSubmit.disabled = true;
  messageArea.textContent = 'Salvando URL e iniciando automação...';
  messageArea.style.color = 'orange';

  try {
    // 1. Primeiro, salva a URL no db.json via JSON-Server (porta 3000)
    const dbResponse = await fetch(API_NF_URL_DB, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: nfURL, timestamp: new Date().toISOString() }),
    });

    if (!dbResponse.ok) throw new Error("Erro ao salvar a URL da NF no db.json.");
    const dbData = await dbResponse.json();
    const nfId = dbData.id;

    // 2. Segundo, chama o servidor de automação (porta 3001) para executar o script
    const automationResponse = await fetch(API_AUTOMAÇÃO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Envia a URL recém-salva e o ID para o servidor de automação
      body: JSON.stringify({ url: nfURL, id: nfId })
    });

    const automationData = await automationResponse.json();

    if (automationResponse.ok && automationData.success) {
      messageArea.textContent = `Sucesso: ${automationData.message}`;
      messageArea.style.color = 'green';
      document.getElementById("nf-url").value = ''; // Limpa o campo
      // Você pode redirecionar aqui ou deixar o usuário ver a mensagem
      // window.location.href = "index.html"; 
    } else {
      throw new Error(automationData.details || automationData.message || "Erro desconhecido na automação.");
    }

  } catch (error) {
    console.error(error);
    messageArea.textContent = `Falha na Importação: ${error.message}`;
    messageArea.style.color = 'red';
  } finally {
    btnSubmit.disabled = false;
  }
}