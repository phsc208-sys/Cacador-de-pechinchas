// catmat_grupo.js
import fs from "fs";
import fetch from "node-fetch";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ${res.status} em ${url}`);
  return res.json();
}

// Função para obter classes (nível 2)
async function obterClasses(codigoGrupo) {
  const url = `https://compras.dados.gov.br/materiais/v1/grupos/${codigoGrupo}/classes.json`;
  const data = await fetchJSON(url);
  return data._embedded.classes.map(c => ({
    codigoClasse: c.codigo,
    nomeClasse: c.nome,
  }));
}

// Função para obter famílias (nível 3)
async function obterFamilias(codigoGrupo, codigoClasse) {
  const url = `https://compras.dados.gov.br/materiais/v1/grupos/${codigoGrupo}/classes/${codigoClasse}/familias.json`;
  const data = await fetchJSON(url);
  return data._embedded?.familias?.map(f => ({
    codigoFamilia: f.codigo,
    nomeFamilia: f.nome,
  })) || [];
}

async function main() {
  const codigoGrupo = 1; // <-- 🟡 troque aqui o número do grupo que quer buscar
  const nomeArquivo = `grupo_${codigoGrupo}.json`;

  console.log(`📦 Iniciando coleta do grupo ${codigoGrupo}...`);

  try {
    const classes = await obterClasses(codigoGrupo);
    console.log(`🔹 ${classes.length} classes encontradas.`);

    for (const classe of classes) {
      console.log(`  📁 Classe ${classe.codigoClasse} - ${classe.nomeClasse}`);
      const familias = await obterFamilias(codigoGrupo, classe.codigoClasse);
      classe.familias = familias;
      console.log(`    └─ ${familias.length} famílias`);
    }

    const resultado = { codigoGrupo, classes };
    fs.writeFileSync(nomeArquivo, JSON.stringify(resultado, null, 2), "utf8");

    console.log(`✅ Dados do grupo ${codigoGrupo} salvos em: ${nomeArquivo}`);
  } catch (err) {
    console.error(`❌ Erro no grupo ${codigoGrupo}: ${err.message}`);
  }
}

main();
