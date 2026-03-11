require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

// Permite requisições do seu Github Pages
app.use(cors()); 

// Configura o multer para armazenar o arquivo em memória temporariamente
const upload = multer({ storage: multer.memoryStorage() });

app.post('/enviar-comprovante', upload.single('comprovante'), async (req, res) => {
    try {
        const { whatsapp, url } = req.body;
        const file = req.file;

        // Validação de segurança no backend
        if (!whatsapp || !url || !file) {
            return res.status(400).json({ error: 'Dados incompletos enviados do frontend.' });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error("ERRO: Variáveis de ambiente do Telegram ausentes.");
            return res.status(500).json({ error: 'Configuração interna do servidor ausente.' });
        }

        // Prepara os dados (multipart/form-data) para a API do Telegram
        const form = new FormData();
        form.append('chat_id', chatId);
        
        // Mensagem que vai aparecer junto com o documento no Telegram
        const caption = `🟢 *NOVO COMPROVANTE*\n\n📱 *WhatsApp:* ${whatsapp}\n🔗 *URL Original:* ${url}`;
        form.append('caption', caption);
        form.append('parse_mode', 'Markdown');
        
        // Anexa o arquivo com o nome original
        form.append('document', file.buffer, { filename: file.originalname });

        // URL da API do Telegram para enviar documentos (funciona para Imagem e PDF)
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;

        // Envia para o Telegram
        await axios.post(telegramUrl, form, {
            headers: form.getHeaders(),
        });

        // Retorna sucesso para o frontend
        res.status(200).json({ success: true, message: 'Comprovante enviado com sucesso!' });

    } catch (error) {
        console.error("Erro ao enviar para o Telegram:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao processar o envio para o Telegram.' });
    }
});

// Inicializa o servidor na porta configurada pelo Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});