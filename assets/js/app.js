// Estrutura JSON inicial
let dados = {
  supermercados: [
    {
      id: 1,
      nome: "Supermercado Central",
      cidade: "São Paulo",
      endereco: "Av. Paulista, 1000",
      telefone: "(11) 99999-0000",
      destaque: true,
      imagem: "assets/img/super1.jpg",
      produtos: [
        { id: 1, nome: "Arroz", descricao: "Arroz branco tipo 1", preco: "R$ 20,00", marca: "Tio João", imagem: "assets/img/produto1.jpg" },
        { id: 2, nome: "Feijão", descricao: "Feijão carioca", preco: "R$ 8,50", marca: "Camil", imagem: "assets/img/produto2.jpg" }
      ]
    },
    {
      id: 2,
      nome: "Supermercado da Esquina",
      cidade: "Rio de Janeiro",
      endereco: "Rua das Flores, 200",
      telefone: "(21) 98888-1111",
      destaque: false,
      imagem: "assets/img/super2.jpg",
      produtos: [
        { id: 1, nome: "Macarrão", descricao: "Macarrão espaguete", preco: "R$ 7,00", marca: "Barilla", imagem: "assets/img/produto3.jpg" }
      ]
    }
  ]
};

// --------------------------- INDEX.HTML ---------------------------

// Montar carrossel de destaques
function carregarCarrossel() {
  const carrossel = document.getElementById("carrossel-destaques");
  if (!carrossel) return;

  carrossel.innerHTML = "";

  dados.supermercados.forEach((sup, index) => {
    if (sup.destaque) {
      const div = document.createElement("div");
      div.className = "carousel-item" + (index === 0 ? " active" : "");
      div.innerHTML = `
        <img src="${sup.imagem}" class="d-block w-100" alt="${sup.nome}">
        <div class="carousel-caption d-none d-md-block">
          <h5>${sup.nome}</h5>
          <p>${sup.cidade} - ${sup.endereco}</p>
        </div>
      `;
      carrossel.appendChild(div);
    }
  });
}

// Montar lista de supermercados
function carregarSupermercados() {
  const lista = document.getElementById("lista-supermercados");
  if (!lista) return;

  lista.innerHTML = "";

  dados.supermercados.forEach(sup => {
    const div = document.createElement("div");
    div.className = "col-md-4";
    div.innerHTML = `
      <div class="card">
        <img src="${sup.imagem}" class="card-img-top" alt="${sup.nome}">
        <div class="card-body">
          <h5 class="card-title">${sup.nome}</h5>
          <p class="card-text">${sup.cidade} - ${sup.endereco}</p>
          <a href="detalhe.html?id=${sup.id}" class="btn btn-primary">Ver Detalhes</a>
        </div>
      </div>
    `;
    lista.appendChild(div);
  });
}

// Botões Início e Adicionar Experiência
document.addEventListener("DOMContentLoaded", () => {
  carregarCarrossel();
  carregarSupermercados();

  const btnInicio = document.getElementById("btn-inicio");
  const btnAdicionar = document.getElementById("btn-adicionar");

  if (btnInicio) {
    btnInicio.addEventListener("click", () => {
      document.getElementById("lista-supermercados").scrollIntoView({ behavior: "smooth" });
    });
  }

  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      window.location.href = "cadastro.html";
    });
  }

  carregarDetalhes();
  carregarCadastro();
});

// --------------------------- DETALHE.HTML ---------------------------
function carregarDetalhes() {
  const nomeSuper = document.getElementById("nome-supermercado");
  const infoSuper = document.getElementById("info-supermercado");
  const listaProdutos = document.getElementById("lista-produtos");

  if (!nomeSuper) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  const sup = dados.supermercados.find(s => s.id === id);
  if (!sup) return;

  nomeSuper.textContent = sup.nome;

  infoSuper.innerHTML = `
    <p><strong>Cidade:</strong> ${sup.cidade}</p>
    <p><strong>Endereço:</strong> ${sup.endereco}</p>
    <p><strong>Telefone:</strong> ${sup.telefone}</p>
    <img src="${sup.imagem}" class="img-fluid rounded mb-3" alt="${sup.nome}">
  `;

  listaProdutos.innerHTML = "";

  sup.produtos.forEach(prod => {
    const div = document.createElement("div");
    div.className = "col-md-4";
    div.innerHTML = `
      <div class="card">
        <img src="${prod.imagem}" class="card-img-top" alt="${prod.nome}">
        <div class="card-body">
          <h5 class="card-title">${prod.nome}</h5>
          <p class="card-text">${prod.descricao}</p>
          <p class="card-text"><strong>Preço:</strong> ${prod.preco}</p>
          <p class="card-text"><strong>Marca:</strong> ${prod.marca}</p>
        </div>
      </div>
    `;
    listaProdutos.appendChild(div);
  });
}

// --------------------------- CADASTRO.HTML ---------------------------
function carregarCadastro() {
  const form = document.getElementById("form-supermercado");
  const btnAddProduto = document.getElementById("btn-add-produto");
  const produtosDiv = document.getElementById("produtos-adicionados");

  if (!form) return;

  let produtosTemp = [];

  btnAddProduto.addEventListener("click", () => {
    const nome = document.getElementById("prod-nome").value;
    const desc = document.getElementById("prod-desc").value;
    const preco = document.getElementById("prod-preco").value;
    const marca = document.getElementById("prod-marca").value;
    const img = document.getElementById("prod-img").value;

    if (!nome) return alert("Preencha o nome do produto.");

    const produto = { id: produtosTemp.length + 1, nome, descricao: desc, preco, marca, imagem: img };
    produtosTemp.push(produto);

    produtosDiv.innerHTML += `<p>${produto.nome} - ${produto.marca} (${produto.preco})</p>`;

    // Limpar campos
    document.getElementById("prod-nome").value = "";
    document.getElementById("prod-desc").value = "";
    document.getElementById("prod-preco").value = "";
    document.getElementById("prod-marca").value = "";
    document.getElementById("prod-img").value = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("sup-nome").value;
    const cidade = document.getElementById("sup-cidade").value;
    const endereco = document.getElementById("sup-endereco").value;
    const telefone = document.getElementById("sup-telefone").value;
    const imagem = document.getElementById("sup-img").value;
    const destaque = document.getElementById("sup-destaque").checked;

    const novoSup = {
      id: dados.supermercados.length + 1,
      nome,
      cidade,
      endereco,
      telefone,
      destaque,
      imagem,
      produtos: produtosTemp
    };

    dados.supermercados.push(novoSup);

    alert("Supermercado cadastrado com sucesso!");
    window.location.href = "index.html";
  });
}
