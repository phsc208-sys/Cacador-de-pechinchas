const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT_SERVER = 3001; // Porta para o servidor de automação

app.use(bodyParser.json());

// Configuração CORS básica para permitir requisições do frontend (rodando em :3000)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Endpoint que recebe a URL e executa o script de importação
app.post('/api/importar-nf', (req, res) => {
    const { url, id } = req.body;

    if (!url || !id) {
        return res.status(400).send({ success: false, message: 'URL ou ID da NF não fornecidos.' });
    }

    // Passa a URL e o ID do db.json como argumentos para o script Node.js
    // O script importarNF.js deve aceitar esses argumentos.
    const command = `node importarNF.js "${url}" "${id}"`;
    
    // Executa o script Node.js
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro de Execução (importarNF.js): ${error.message}`);
            return res.status(500).send({ 
                success: false, 
                message: 'Erro no servidor ao processar a NF.',
                details: stderr || error.message 
            });
        }
        
        console.log(`Script Output: ${stdout}`);
        
        // Embora o script salve o HTML, o servidor só informa que a automação foi bem-sucedida.
        res.send({ 
            success: true, 
            message: 'Importação da NF concluída. O arquivo pagina_nf.html foi atualizado.', 
            output: stdout 
        });
    });
});

app.listen(PORT_SERVER, () => {
    console.log(`Servidor de Automação rodando em http://localhost:${PORT_SERVER}`);
});