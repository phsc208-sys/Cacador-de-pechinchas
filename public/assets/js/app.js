// ====== JSON com supermercados e produtos ======
const dadosIniciais = {
  "supermercados": [
    {
      "id": 1,
      "nome": "Supermercado BH",
      "cidade": "Belo Horizonte",
      "endereco": "Av. Afonso Pena, 1000",
      "telefone": "(31) 3333-1111",
      "imagem": "assets/img/bh.jpeg",
      "destaque": true,
      "produtos": [
        { "nome": "Arroz 5kg", "descricao": "Pacote de arroz branco", "preco": "R$25,00", "marca": "Tio João", "imagem": "assets/img/produtos/arroz.jpg" },
        { "nome": "Feijão Carioca 1kg", "descricao": "Pacote de feijão", "preco": "R$8,50", "marca": "Camil", "imagem": "assets/img/produtos/feijao.jpg" },
        { "nome": "Açúcar 1kg", "descricao": "Açúcar refinado", "preco": "R$4,50", "marca": "União", "imagem": "assets/img/produtos/acucar.jpg" },
        { "nome": "Leite Integral 1L", "descricao": "Leite fresco integral", "preco": "R$5,50", "marca": "Itambé", "imagem": "assets/img/produtos/leite.jpg" },
        { "nome": "Óleo de Soja 900ml", "descricao": "Óleo refinado", "preco": "R$7,00", "marca": "Liza", "imagem": "assets/img/produtos/oleo.jpg" },
        { "nome": "Café 500g", "descricao": "Café torrado e moído", "preco": "R$15,00", "marca": "Melitta", "imagem": "assets/img/produtos/cafe.jpg" }
      ]
    },
    {
      "id": 2,
      "nome": "Supermercado Assaí",
      "cidade": "Belo Horizonte",
      "endereco": "Av. Cristiano Machado, 2000",
      "telefone": "(31) 3333-2222",
      "imagem": "assets/img/Assaí.webp",
      "destaque": true,
      "produtos": [
        { "nome": "Arroz Integral 5kg", "descricao": "Pacote integral", "preco": "R$28,00", "marca": "Tio João", "imagem": "assets/img/produtos/arroz_integral.jpg" },
        { "nome": "Feijão Preto 1kg", "descricao": "Feijão preto", "preco": "R$9,00", "marca": "Camil", "imagem": "assets/img/produtos/feijao_preto.jpg" },
        { "nome": "Açúcar Mascavo 1kg", "descricao": "Açúcar natural", "preco": "R$6,50", "marca": "União", "imagem": "assets/img/produtos/acucar_mascavo.jpg" },
        { "nome": "Leite Desnatado 1L", "descricao": "Leite desnatado", "preco": "R$5,80", "marca": "Itambé", "imagem": "assets/img/produtos/leite_desnatado.jpg" },
        { "nome": "Óleo de Milho 900ml", "descricao": "Óleo refinado", "preco": "R$7,50", "marca": "Liza", "imagem": "assets/img/produtos/oleo_milho.jpg" },
        { "nome": "Café Torrado 500g", "descricao": "Café premium", "preco": "R$18,00", "marca": "Melitta", "imagem": "assets/img/produtos/cafe_torrado.jpg" }
      ]
    },
    {
      "id": 3,
      "nome": "Supermercado Epa",
      "cidade": "Belo Horizonte",
      "endereco": "Rua Padre Eustáquio, 150",
      "telefone": "(31) 3333-3333",
      "imagem": "assets/img/epa.webp",
      "destaque": true,
      "produtos": [
        { "nome": "Macarrão 500g", "descricao": "Espaguete tradicional", "preco": "R$6,00", "marca": "Renata", "imagem": "assets/img/produtos/macarrao.jpg" },
        { "nome": "Molho de Tomate 340g", "descricao": "Molho pronto", "preco": "R$4,00", "marca": "Pomarola", "imagem": "assets/img/produtos/molho_tomate.jpg" },
        { "nome": "Sal Refinado 1kg", "descricao": "Sal refinado", "preco": "R$3,50", "marca": "Cisne", "imagem": "assets/img/produtos/sal.jpg" },
        { "nome": "Margarina 500g", "descricao": "Margarina cremosa", "preco": "R$7,00", "marca": "Qualy", "imagem": "assets/img/produtos/margarina.jpg" },
        { "nome": "Refrigerante 2L", "descricao": "Refrigerante cola", "preco": "R$8,00", "marca": "Coca-Cola", "imagem": "assets/img/produtos/refrigerante.jpg" },
        { "nome": "Suco 1L", "descricao": "Suco de laranja natural", "preco": "R$6,50", "marca": "Del Valle", "imagem": "assets/img/produtos/suco.jpg" }
      ]
    },
    {
      "id": 4,
      "nome": "Meu Prata",
      "cidade": "Belo Horizonte",
      "endereco": "Av. Cristiano Machado, 3000",
      "telefone": "(31) 3333-4444",
      "imagem": "assets/img/meuprata.jpg",
      "destaque": false,
      "produtos": [
        { "nome": "Pão Francês 500g", "descricao": "Pão fresco", "preco": "R$6,00", "marca": "Padaria Local", "imagem": "assets/img/produtos/pao.jpg" },
        { "nome": "Queijo Mussarela 1kg", "descricao": "Queijo fatiado", "preco": "R$35,00", "marca": "Vigor", "imagem": "assets/img/produtos/queijo.jpg" },
        { "nome": "Presunto 1kg", "descricao": "Presunto fatiado", "preco": "R$30,00", "marca": "Sadia", "imagem": "assets/img/produtos/presunto.jpg" },
        { "nome": "Iogurte 170g", "descricao": "Iogurte natural", "preco": "R$3,50", "marca": "Itambé", "imagem": "assets/img/produtos/iogurte.jpg" },
        { "nome": "Manteiga 200g", "descricao": "Manteiga cremosa", "preco": "R$10,00", "marca": "Aviação", "imagem": "assets/img/produtos/manteiga.jpg" },
        { "nome": "Cereal Matinal 500g", "descricao": "Cereal de milho", "preco": "R$12,00", "marca": "Kellogg's", "imagem": "assets/img/produtos/cereal.jpg" }
      ]
    }
  ]
};

// ====== LocalStorage (sobrescrevendo para garantir imagens) ======
let supermercados = dadosIniciais.supermercados;
localStorage.setItem("supermercados", JSON.stringify(supermercados));

// ====== Carrossel de destaques ======
function montarDestaques() {
  const container = document.getElementById("destaquesContainer");
  if (!container) return;

  const destaques = supermercados.filter(s => s.destaque);
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
}

// ====== Lista de supermercados ======
function montarListaSupermercados() {
  const container = document.getElementById("supermercadosContainer");
  if (!container) return;

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
}

// ====== Página de detalhes ======
function montarDetalhes() {
  const container = document.getElementById("detalheContainer");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  const s = supermercados.find(s => s.id === id);
  if (!s) {
    container.innerHTML = "<p>Supermercado não encontrado!</p>";
    return;
  }

  container.innerHTML = `
    <h2>${s.nome}</h2>
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
}

// ====== Inicialização ======
document.addEventListener("DOMContentLoaded", () => {
  montarDestaques();
  montarListaSupermercados();
  montarDetalhes();
});
