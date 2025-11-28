// CONSTANTES 
const API_URL = "http://localhost:3000/supermercados";
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicGVkcm9jYXJkb3NvIiwiYSI6ImNtaTE2bXlnNTE2NnoybW9zNnZ5b2h4bWYifQ.uAMtpLEGogdxU7Mh5vYK0w'; 
const BH_CENTER = [-43.9345, -19.9227];

// VARIÁVEIS GLOBAIS 
let map;

// LISTENER DA PÁGINA 
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mapaContainer")) {
    navigator.geolocation.getCurrentPosition(
      processarGetCurrentPosition,
      tratarErroLocalizacao
    );
  }
});

// LOCALIZAÇÃO DO USUÁRIO 
function processarGetCurrentPosition(local) {
  const userCoords = [local.coords.longitude, local.coords.latitude];
  criarMapa(userCoords);

  let popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`<h3>Estou aqui!</h3>`);

  new mapboxgl.Marker({ color: '#FFD700' }) 
    .setLngLat(userCoords)
    .setPopup(popup)
    .addTo(map);

  carregarMarcadoresSupermercados();
}

// ERRO DE LOCALIZAÇÃO
function tratarErroLocalizacao() {
  criarMapa(BH_CENTER);
  carregarMarcadoresSupermercados();
}

// CRIAÇÃO DO MAPA
function criarMapa(centerCoords) {
  const loadingMessage = document.getElementById("loading-message");

  if (typeof mapboxgl === 'undefined') {
      loadingMessage.textContent = 'Erro: Biblioteca Mapbox não foi carregada.';
      loadingMessage.className = 'text-center mt-3 text-danger';
      return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: centerCoords,
      zoom: 12
  });

  map.addControl(new mapboxgl.NavigationControl());
}

// MARCADORES DOS SUPERMERCADOS
async function carregarMarcadoresSupermercados() {
  const loadingMessage = document.getElementById("loading-message");

  if (!map) {
    console.error("O mapa não foi inicializado.");
    return;
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar dados.");

    const supermercados = await response.json();
    
    if (supermercados.length === 0) {
        loadingMessage.textContent = 'Nenhum supermercado cadastrado.';
        return;
    }

    for (const s of supermercados) {
      if (s.latitude && s.longitude) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3>${s.nome}</h3>
            <p>${s.endereco}, ${s.cidade}</p>
            <a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver Produtos</a>
          `);

        new mapboxgl.Marker({ color: '#e9710f' }) 
          .setLngLat([s.longitude, s.latitude])
          .setPopup(popup)
          .addTo(map);
      }
    }

    loadingMessage.style.display = 'none';

  } catch (error) {
    console.error(error);
    loadingMessage.textContent = 'Falha ao carregar os marcadores.';
    loadingMessage.className = 'text-center mt-3 text-danger';
  }
}
