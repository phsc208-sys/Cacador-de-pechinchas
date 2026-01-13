# Caçador de Pechinchas

O **Caçador de Pechinchas** é uma solução *full-stack* desenvolvida para automatizar a extração, normalização e visualização de dados provenientes de notas fiscais de varejo. O sistema transforma dados brutos e abreviados em informações estruturadas, permitindo uma análise comparativa de preços e geolocalização de pontos de venda.

## 🛠️ Arquitetura e Tecnologias

O projeto foi estruturado para garantir a integridade dos dados e a performance na renderização das análises:

* **Backend:** Node.js com Express para coordenação dos fluxos de dados.
* **Processamento de IA:** Integração com a API do Google Gemini para categorização técnica (Padrão CATMAT) e limpeza de abreviações.
* **Data Scraping:** Utilização de Cheerio para extração precisa de informações de documentos HTML/NFs.
* **Frontend:** Dashboards interativos com Chart.js e mapeamento dinâmico com Mapbox API.
* **Persistência:** Base de dados em formato JSON para garantir agilidade no desenvolvimento e portabilidade.

## 🚀 Funcionalidades Principais

### 1. Processamento Inteligente de Notas Fiscais
O motor principal do sistema (`processarNF.js`) utiliza Engenharia de Prompts para converter descrições genéricas de produtos em categorias normalizadas. O sistema identifica automaticamente o nome do produto, a marca, a quantidade e a unidade de medida, mesmo quando os dados originais estão altamente abreviados.

### 2. Geocodificação e Análise Espacial
Através da API de geolocalização, o sistema converte endereços de estabelecimentos em coordenadas geográficas, permitindo a visualização de "manchas de preço" em um mapa interativo.

### 3. Dashboards de Mercado
Visualização de métricas como:
* Preço médio por categoria.
* Histórico de variação de preços de produtos específicos.
* Comparativo entre diferentes redes de varejo.

## 📦 Estrutura do Projeto

├── db/                   # Persistência de dados (JSON)
├── public/               # Interface e lógica do cliente
│   ├── assets/js/        # Controladores (Mapa, Dashboard, App)
│   └── assets/css/       # Estilização modular
├── server.js             # Servidor e rotas da API
├── processarNF.js        # Lógica de integração com IA (Gemini)
└── importarNF.js         # Motor de extração de dados brutos

## ⚙️ Configuração

### Para executar o projeto localmente, é necessário configurar as variáveis de ambiente em um arquivo .env:
GEMINI_API_KEY=tua_chave_aqui
MAPBOX_TOKEN=teu_token_aqui
PORT=3000

### Instalação de dependências e execução:

npm install
node server.js


