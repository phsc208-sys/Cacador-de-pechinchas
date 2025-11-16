// --- CONSTANTES ESPECÍFICAS DO MAPA ---
const API_URL = "http://localhost:3000/supermercados";
// Token de acesso público do Mapbox (para exemplos e testes)
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMGtiOTQzcWp6eDk3dDM2bSJ9.joccVEiInu997Nmr7--GgQ';

// --- LISTENER DA PÁGINA DO MAPA ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mapaContainer")) {
    montarMapa();
  }
});

// --- FUNÇÃO DO MAPA ---

/**
 * Busca dados de todos os supermercados e monta o mapa com marcadores.
 */
async function montarMapa() {
  const loadingMessage = document.getElementById("loading-message");
  
  if (typeof mapboxgl === 'undefined') {
      loadingMessage.textContent = 'Erro: Biblioteca Mapbox não foi carregada.';
      loadingMessage.className = 'text-center mt-3 text-danger';
      return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-43.9345, -19.9227], // Coordenadas de Belo Horizonte
      zoom: 12
  });

  map.addControl(new mapboxgl.NavigationControl());

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar dados para o mapa.");

    const supermercados = await response.json();
    
    if (supermercados.length === 0) {
        loadingMessage.textContent = 'Nenhum supermercado cadastrado para exibir no mapa.';
        return;
    }

    // Adiciona marcadores para cada supermercado
    for (const s of supermercados) {
      // Verifica se o supermercado tem coordenadas válidas
      if (s.latitude && s.longitude) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3>${s.nome}</h3>
            <p>${s.endereco}, ${s.cidade}</p>
            <a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver Produtos</a>
          `);

        new mapboxgl.Marker()
          .setLngLat([s.longitude, s.latitude])
          .setPopup(popup)
          .addTo(map);
      }
    }

    loadingMessage.style.display = 'none'; // Esconde a mensagem de loading

  } catch (error) {
    console.error(error);
    loadingMessage.textContent = 'Falha ao carregar os marcadores do mapa.';
    loadingMessage.className = 'text-center mt-3 text-danger';
  }
}