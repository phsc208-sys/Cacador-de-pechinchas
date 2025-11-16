document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("main-header");
    if (!headerContainer) {
        console.error("Elemento #main-header não encontrado. A navegação não pode ser carregada.");
        return;
    }

    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    
    const links = {
        "index.html": currentPage === "index.html" ? "active" : "",
        "cadastro.html": (currentPage === "cadastro.html" || currentPage === "detalhe.html") ? "active" : "",
        "importar.html": currentPage === "importar.html" ? "active" : "",
        "mapa.html": currentPage === "mapa.html" ? "active" : ""
    };
    
    if (currentPage === "cadastro.html" && window.location.search.includes("id=")) {
         links["cadastro.html"] = "active";
    }
     if (currentPage === "detalhe.html") {
        links["index.html"] = ""; 
        links["cadastro.html"] = ""; 
     }


    const navbarHTML = `
      <h1 class="mb-3">Caçador de Pechinchas</h1>
      <div class="d-flex gap-2 flex-wrap">
        <a href="index.html" id="btn-inicio" class="btn btn-dark ${links['index.html']}">Início</a>
        <a href="cadastro.html" id="btn-adicionar" class="btn btn-dark ${links['cadastro.html']}">Adicionar Experiência</a>
        <a href="importar.html" class="btn btn-dark ${links['importar.html']}">Importar NF</a>
        <a href="mapa.html" class="btn btn-dark ${links['mapa.html']}">Mapa</a>
      </div>
    `;

    headerContainer.innerHTML = navbarHTML;
});