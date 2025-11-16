const API_URL = "http://localhost:3000/supermercados";
const API_AUTOMAÇÃO_URL = "http://localhost:3001/api/importar-nf";

let produtosTemporarios = [];

document.addEventListener("DOMContentLoaded", () => {
  // Código para a PÁGINA INICIAL (index.html)
  if (document.getElementById("destaquesContainer")) {
    montarDestaques();
    montarListaSupermercados();
  }

  // Listeners da PÁGINA INICIAL (index.html)
  // REMOVIDOS - Agora são gerenciados pelo nav.js e HTML
  /*
  if (document.getElementById("btn-inicio")) {
    document.getElementById("btn-inicio").addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
  if (document.getElementById("btn-adicionar")) {
    document.getElementById("btn-adicionar").addEventListener("click", () => {
      window.location.href = "cadastro.html";
    });
  }
  */

  // Código para a PÁGINA DE DETALHES (detalhe.html)
  if (document.getElementById("detalheContainer")) {
    montarDetalhes();
  }

  // Código para a PÁGINA DE CADASTRO (cadastro.html)
  if (document.getElementById("form-supermercado")) {
    configurarFormulario();
  }

  // Código para a PÁGINA DE IMPORTAÇÃO (importar.html)
  if (document.getElementById("form-importar-nf")) {
    document.getElementById("form-importar-nf").addEventListener("submit", handleImportarNF);
  }
});

// --- FUNÇÕES DA PÁGINA INICIAL ---

async function montarDestaques() {
  const container = document.getElementById("destaquesContainer");
  if (!container) return; // Verificação de segurança

  try {
    const response = await fetch(`${API_URL}?destaque=true`);
    if (!response.ok) throw new Error("Erro ao buscar destaques.");

    const destaques = await response.json();

    container.innerHTML = "";
    destaques.forEach((s, index) => {
      const active = index === 0 ? "active" : "";
      container.innerHTML += `
        <div class="carousel-item ${active}">
          <img src="${s.imagem}" class="d-block w-100" alt="${s.nome}" style="object-fit: cover; height: 400px;" onerror="this.src='https://placehold.co/1200x400/eeeeee/333333?text=Imagem+Indispon%C3%ADvel'">
          <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
            <h5>${s.nome}</h5>
            <p>${s.cidade}</p>
          </div>
        </div>
      `;
    });
    
    if (destaques.length === 0) {
        container.innerHTML = `
        <div class="carousel-item active">
          <img src="https://placehold.co/1200x400/eeeeee/333333?text=Sem+Destaques" class="d-block w-100" alt="Sem destaques">
          <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
            <h5>Adicione um supermercado</h5>
            <p>Marque-o como destaque para aparecer aqui.</p>
          </div>
        </div>`;
    }

  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Não foi possível carregar os destaques.</p>";
  }
}

async function montarListaSupermercados() {
  const container = document.getElementById("supermercadosContainer");
  if (!container) return; // Verificação de segurança

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar supermercados.");

    const supermercados = await response.json();
    
    container.innerHTML = ""; 
    
    if (supermercados.length === 0) {
        container.innerHTML = `<div class="col-12"><p class="text-center">Nenhum supermercado cadastrado.</p></div>`;
        return;
    }

    supermercados.forEach(s => {
      container.innerHTML += `
        <div class="col-md-4 mb-4">
          <div class="card h-100 shadow-sm">
            <img src="${s.imagem}" class="card-img-top" alt="${s.nome}" style="height: 200px; object-fit: cover;" onerror="this.src='https://placehold.co/600x400/eeeeee/333333?text=Imagem+Indispon%C3%ADvel'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${s.nome}</h5>
              <p class="card-text">${s.cidade} - ${s.endereco}</p>
              <a href="detalhe.html?id=${s.id}" class="btn btn-primary mt-auto">Detalhes</a>
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

// --- FUNÇÕES DA PÁGINA DE DETALHES ---

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
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2>${s.nome}</h2>
        <div>
          <a href="cadastro.html?id=${s.id}" class="btn btn-success">Editar</a>
          <button id="btn-excluir" class="btn btn-danger">Excluir</button>
        </div>
      </div>
      <p><strong>Cidade:</strong> ${s.cidade}</p>
      <p><strong>Endereço:</strong> ${s.endereco}</p>
      <p><strong>Telefone:</strong> ${s.telefone}</p>
      ${s.cnpj ? `<p><strong>CNPJ:</strong> ${s.cnpj}</p>` : ''}
      ${s.latitude ? `<p><strong>Coordenadas:</strong> ${s.latitude}, ${s.longitude}</p>` : ''}
      <img src="${s.imagem}" alt="${s.nome}" class="img-fluid rounded mb-4 shadow-sm" style="max-height: 400px; width: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/1200x400/eeeeee/333333?text=Imagem+Indispon%C3%ADvel'">
      <h3 class="mt-4">Produtos</h3>
      <div class="row">
        ${s.produtos && s.produtos.length > 0 ? s.produtos.map(p => `
          <div class="col-md-4 mb-3">
            <div class="card h-100 shadow-sm">
              <img src="${p.imagem}" class="card-img-top" alt="${p.nome_decifrado || p.nome}" style="height: 180px; object-fit: cover;" onerror="this.src='https://placehold.co/600x400/eeeeee/333333?text=Sem+Imagem'">
              <div class="card-body">
                <h5 class="card-title">${p.nome_decifrado || p.nome}</h5>
                
                ${p.categoria_principal ? `<span class="badge ${p.categoria_principal === 'Manual' ? 'bg-warning text-dark' : 'bg-secondary'}">${p.categoria_principal}</span>` : ''}
                ${p.subcategoria && p.subcategoria !== 'N/A' ? `<span class="badge bg-info ms-1">${p.subcategoria}</span>` : ''}
                
                ${p.nome_decifrado && p.nome !== p.nome_decifrado ? `<p class="text-muted small mt-2 mb-0">Original: ${p.nome}</p>` : ''}
                
                ${p.preco_unidade ? `<p class="card-text fs-5 text-success fw-bold mb-1">${p.preco_unidade}</p>` : (p.preco ? `<p class="card-text fs-5 text-success fw-bold mb-1">${p.preco}</p>` : '')}
                
                ${p.data_nota_fiscal ? `<p class="small mb-0"><strong>Data Compra:</strong> ${p.data_nota_fiscal}</p>` : (p.data_cadastro ? `<p class="small mb-0"><strong>Data Cadastro:</strong> ${p.data_cadastro}</p>` : '')}
                ${p.quantidade ? `<p class="small mb-0"><strong>Qtd. na NF:</strong> ${p.quantidade}</p>` : ''}
                <p class="small mb-0"><strong>Marca:</strong> ${p.marca || 'N/A'}</p>
              </div>
            </div>
          </div>
        `).join("") : '<p class="col-12">Nenhum produto cadastrado para este supermercado.</p>'}
      </div>
    `;

    document.getElementById("btn-excluir").addEventListener("click", () => handleExcluir(id));

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>${error.message}</p>`;
  }
}

// --- FUNÇÕES DA PÁGINA DE CADASTRO ---

async function configurarFormulario() {
  const form = document.getElementById("form-supermercado");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  document.getElementById("btn-add-produto").addEventListener("click", adicionarProdutoTemporario);

  if (id) {
    // Modo Edição
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
      
      if (data.cnpj) {
          const cnpjInput = document.createElement('input');
          cnpjInput.type = "hidden";
          cnpjInput.id = "sup-cnpj";
          cnpjInput.value = data.cnpj;
          form.prepend(cnpjInput);
      }
      
      // Manter coordenadas se existirem (para não as apagar na atualização)
      if (data.latitude) {
          const latInput = document.createElement('input');
          latInput.type = "hidden";
          latInput.id = "sup-latitude-hidden";
          latInput.value = data.latitude;
          form.prepend(latInput);
          
          const lonInput = document.createElement('input');
          lonInput.type = "hidden";
          lonInput.id = "sup-longitude-hidden";
          lonInput.value = data.longitude;
          form.prepend(lonInput);
      }

      // Filtra produtos: mantém apenas os manuais para edição
      produtosTemporarios = (data.produtos || []).filter(p => !p.data_nota_fiscal && p.categoria_principal === 'Manual');
      renderizarProdutosTemporarios();
      form.addEventListener("submit", handleUpdate);

    } catch (error) {
      console.error("Erro ao carregar dados para edição:", error);
    }
  } else {
    // Modo Criação
    form.addEventListener("submit", handleCreate);
  }
}

function adicionarProdutoTemporario() {
  const precoRaw = document.getElementById("prod-preco").value.trim();
  // Corrigindo para aceitar R$ 10,90 ou 10.90
  const precoNumerico = parseFloat(precoRaw.replace('R$', '').replace('.', '').replace(',', '.'));
  
  if (isNaN(precoNumerico)) {
    showCustomModal("O Preço deve ser um valor numérico válido (ex: 10,99).");
    return;
  }
  
  const precoFormatado = `R$ ${precoNumerico.toFixed(2).replace('.', ',')}`;
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const nomeProduto = document.getElementById("prod-nome").value;
  const imagemProduto = document.getElementById("prod-img").value || "https://placehold.co/600x400/eeeeee/333333?text=Sem+Imagem"; 

  if (!nomeProduto || !precoRaw) {
    showCustomModal("Nome e Preço do produto são obrigatórios.");
    return;
  }

  const produto = {
    nome: nomeProduto,
    descricao: document.getElementById("prod-desc").value || 'N/A', 
    preco_unidade: precoFormatado, 
    data_cadastro: dataHoje, 
    marca: document.getElementById("prod-marca").value || 'N/A',
    imagem: imagemProduto,
    categoria_principal: 'Manual', // Categoria para produtos manuais
    subcategoria: 'N/A'
  };

  // Remove o campo 'preco' antigo se existir, mantendo apenas 'preco_unidade'
  delete produto.preco; 
  
  produtosTemporarios.push(produto);
  renderizarProdutosTemporarios();

  // Limpa campos do formulário de produto
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
    container.innerHTML = "<p>Nenhum produto adicionado manualmente.</p>";
    return;
  }

  produtosTemporarios.forEach((prod, index) => {
    const precoDisplay = prod.preco_unidade || prod.preco || 'N/A'; 
    container.innerHTML += `
      <div class="card card-body mb-2 d-flex flex-row justify-content-between align-items-center">
        <span><strong>${prod.nome}</strong> - ${precoDisplay}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="removerProdutoTemporario(${index})">Remover</button>
      </div>
    `;
  });
}

// Tornando a função global para que o onclick do HTML a possa encontrar
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
    // Coordenadas não são mais pegas do formulário
    imagem: document.getElementById("sup-img").value || "https://placehold.co/600x400/eeeeee/333333?text=Sem+Imagem", 
    destaque: document.getElementById("sup-destaque").checked,
    produtos: produtosTemporarios
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supermercado),
    });

    if (!response.ok) throw new Error("Erro ao cadastrar supermercado.");

    showCustomModal("Supermercado cadastrado com sucesso!", "success");
    produtosTemporarios = [];
    setTimeout(() => window.location.href = "index.html", 1500); // Aguarda 1.5s antes de redirecionar

  } catch (error) {
    console.error(error);
    showCustomModal(error.message);
  }
}

async function handleUpdate(event) {
  event.preventDefault();
  const id = document.getElementById("sup-id").value;

  try {
    const existingResponse = await fetch(`${API_URL}/${id}`);
    const existingData = await existingResponse.json();
    
    // Mantém apenas os produtos importados (que têm data_nota_fiscal)
    const produtosImportados = (existingData.produtos || []).filter(p => p.data_nota_fiscal);
    // Junta os produtos importados com os produtos manuais (editados/novos)
    const produtosCompletos = produtosImportados.concat(produtosTemporarios);
    
    const imagemValor = document.getElementById("sup-img").value || "https://placehold.co/600x400/eeeeee/333333?text=Sem+Imagem";

    // Pega as coordenadas escondidas (se existirem) para mantê-las
    const latHidden = document.getElementById("sup-latitude-hidden");
    const lonHidden = document.getElementById("sup-longitude-hidden");

    const supermercado = {
        nome: document.getElementById("sup-nome").value,
        cidade: document.getElementById("sup-cidade").value,
        endereco: document.getElementById("sup-endereco").value,
        telefone: document.getElementById("sup-telefone").value,
        latitude: latHidden ? parseFloat(latHidden.value) : (existingData.latitude || null),
        longitude: lonHidden ? parseFloat(lonHidden.value) : (existingData.longitude || null),
        imagem: imagemValor,
        destaque: document.getElementById("sup-destaque").checked,
        cnpj: document.getElementById("sup-cnpj") ? document.getElementById("sup-cnpj").value : existingData.cnpj,
        produtos: produtosCompletos
    };

    // Remove lat/lon se forem null
    if (supermercado.latitude === null) delete supermercado.latitude;
    if (supermercado.longitude === null) delete supermercado.longitude;
  
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supermercado),
    });

    if (!response.ok) throw new Error("Erro ao atualizar supermercado.");

    showCustomModal("Supermercado atualizado com sucesso!", "success");
    produtosTemporarios = [];
    setTimeout(() => window.location.href = `detalhe.html?id=${id}`, 1500); 

  } catch (error) {
    console.error(error);
    showCustomModal(error.message);
  }
}

async function handleExcluir(id) {
  // Substitui o confirm() por um modal customizado
  showCustomModal("Tem certeza que deseja excluir este supermercado?", "confirm", async () => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir supermercado.");

      showCustomModal("Supermercado excluído com sucesso!", "success");
      setTimeout(() => window.location.href = "index.html", 1500);

    } catch (error) {
      console.error(error);
      showCustomModal(error.message);
    }
  });
}

// --- FUNÇÃO DA PÁGINA DE IMPORTAÇÃO ---

async function handleImportarNF(event) {
  event.preventDefault();
  
  const nfURL = document.getElementById("nf-url").value;
  // Elementos de feedback no importar.html
  const messageArea = document.getElementById("message-area") || { textContent: '', style: {} }; 
  const btnSubmit = document.querySelector("#form-importar-nf button[type='submit']");
  
  messageArea.textContent = ''; 
  
  if (!nfURL) {
    messageArea.textContent = "A URL da Nota Fiscal é obrigatória.";
    messageArea.style.color = 'red';
    messageArea.style.display = 'block'; // Garante que a mensagem de erro seja exibida
    return;
  }

  btnSubmit.disabled = true;
  messageArea.textContent = 'Iniciando download e processamento da NF (incluindo IA)... Por favor, aguarde.';
  messageArea.style.color = 'orange';
  messageArea.style.display = 'block';

  try {
    // 1. Chama o servidor de automação (porta 3001) para executar os scripts
    const automationResponse = await fetch(API_AUTOMAÇÃO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Envia apenas a URL
        body: JSON.stringify({ url: nfURL }) 
    });

    const automationData = await automationResponse.json();

    if (automationResponse.ok && automationData.success) {
        // Redireciona para o início ou mostra sucesso
        messageArea.textContent = `Sucesso: ${automationData.message}`;
        messageArea.style.color = 'green';
        document.getElementById("nf-url").value = ''; // Limpa o campo
        
        // Mostra um modal de sucesso e redireciona
        showCustomModal("Importação concluída com sucesso! Redirecionando...", "success");
        setTimeout(() => window.location.href = "index.html", 2000); 
        
    } else {
        throw new Error(automationData.details || automationData.message || "Erro desconhecido na automação.");
    }

  } catch (error) {
    console.error(error);
    const errorMessage = `Falha na Importação: ${error.message}. Verifique o console do servidor (porta 3001) para detalhes.`;
    messageArea.textContent = errorMessage;
    messageArea.style.color = 'red';
    showCustomModal(errorMessage); // Mostra o erro no modal também
  } finally {
    btnSubmit.disabled = false;
  }
}

// --- FUNÇÃO MODAL CUSTOMIZADA (para substituir alert e confirm) ---

/**
 * Exibe um modal customizado.
 * @param {string} message - A mensagem para exibir.
 * @param {'info' | 'success' | 'confirm'} type - O tipo de modal. 'confirm' exibe botões Sim/Não.
 * @param {function | null} onConfirm - A função a ser executada se o usuário clicar em "Sim" (apenas para type 'confirm').
 */
function showCustomModal(message, type = 'info', onConfirm = null) {
  // Remove qualquer modal existente
  let existingModal = document.getElementById('customModal');
  if (existingModal) {
    existingModal.remove();
  }
  let existingBackdrop = document.getElementById('customModalBackdrop');
  if (existingBackdrop) {
      existingBackdrop.remove();
  }


  // Cria o backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'customModalBackdrop';
  backdrop.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.5); z-index: 1050;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.3s ease;
  `;

  // Cria o conteúdo do modal
  const modalContent = document.createElement('div');
  modalContent.id = 'customModal';
  modalContent.style = `
    background-color: white; padding: 20px 30px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    width: 90%; max-width: 400px; z-index: 1051;
    text-align: center;
    transform: scale(0.9); transition: transform 0.3s ease;
  `;

  // Mensagem
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.fontSize = '1.1rem';
  messageElement.style.marginBottom = '20px';
  messageElement.style.wordWrap = 'break-word';
  modalContent.appendChild(messageElement);

  // Botões
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.gap = '10px';
  
  const btnClose = document.createElement('button');
  btnClose.textContent = (type === 'confirm') ? 'Não' : 'Fechar';
  btnClose.className = 'btn btn-secondary';
  btnClose.onclick = () => {
    backdrop.style.opacity = 0;
    modalContent.style.transform = 'scale(0.9)';
    setTimeout(() => backdrop.remove(), 300);
  };

  if (type === 'confirm') {
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Sim';
    btnConfirm.className = 'btn btn-danger'; // Para exclusão
    btnConfirm.onclick = () => {
      if (onConfirm) onConfirm();
      btnClose.onclick(); // Fecha o modal
    };
    buttonContainer.appendChild(btnConfirm);
    buttonContainer.appendChild(btnClose);
  } else {
    // Muda a cor do botão para 'success'
    if (type === 'success') {
      btnClose.className = 'btn btn-success';
    }
    buttonContainer.appendChild(btnClose);
  }

  modalContent.appendChild(buttonContainer);
  backdrop.appendChild(modalContent);
  document.body.appendChild(backdrop);

  // Animação de entrada
  setTimeout(() => {
      backdrop.style.opacity = 1;
      modalContent.style.transform = 'scale(1)';
  }, 10);
}