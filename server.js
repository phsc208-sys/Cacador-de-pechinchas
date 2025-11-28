const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT_SERVER = 3001; // Porta do Servidor de Automação

app.use(bodyParser.json());

// Configuração CORS básica
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Endpoint que recebe a URL e executa os scripts
app.post('/api/importar-nf', (req, res) => {
    const { url } = req.body; // Não precisamos mais do ID neste fluxo

    if (!url) {
        return res.status(400).send({ success: false, message: 'URL da NF não fornecida.' });
    }

    // 1. Comando para executar o script de download
    const downloadCommand = `node importarNF.js "${url}"`;

    exec(downloadCommand, (errorDownload, stdoutDownload, stderrDownload) => {
        if (errorDownload) {
            console.error(`Erro ao baixar (importarNF.js): ${errorDownload.message}`);
            return res.status(500).send({ 
                success: false, 
                message: 'Falha no download da NF.',
                details: stderrDownload || errorDownload.message 
            });
        }
        
        console.log(`Download da NF concluído. Resultado: ${stdoutDownload}`);
        
        // 2. Comando para executar o script de processamento e salvamento
        const processCommand = `node processarNF.js`;

        exec(processCommand, (errorProcess, stdoutProcess, stderrProcess) => {
            if (errorProcess) {
                console.error(`Erro ao processar (processarNF.js): ${errorProcess.message}`);
                 return res.status(500).send({ 
                    success: false, 
                    message: 'NF baixada, mas o processamento falhou.',
                    details: stderrProcess || errorProcess.message 
                });
            }

            console.log(`Processamento concluído. Resultado: ${stdoutProcess}`);

            res.send({ 
                success: true, 
                message: 'NF baixada e dados de produtos salvos no db.json com sucesso.', 
                output: stdoutProcess 
            });
        });
    });
});

app.listen(PORT_SERVER, () => {
    console.log(`Servidor de Automação rodando em http://localhost:${PORT_SERVER}`);
});