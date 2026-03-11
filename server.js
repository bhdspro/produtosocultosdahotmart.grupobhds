require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/enviar-comprovante', upload.single('comprovante'), async (req, res) => {
    try {
        const { whatsapp, url } = req.body;
        const file = req.file;

        if (!whatsapp || !url || !file) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // 1. Enviar o Arquivo
        const fileForm = new FormData();
        fileForm.append('chat_id', chatId);
        fileForm.append('document', file.buffer, { filename: file.originalname });
        
        await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, fileForm, {
            headers: fileForm.getHeaders(),
        });

        // 2. Enviar os Dados (WhatsApp e URL) em uma mensagem separada para garantir o recebimento
        const textMsg = `✅ *NOVA CONSULTA DE PRODUTO*\n\n` +
                        `*WhatsApp:* ${whatsapp}\n` +
                        `*URL do Produto:* ${url}`;

        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: textMsg,
            parse_mode: 'Markdown'
        });

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Erro:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao enviar para o Telegram.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
```

---

### 2. Ajuste no Frontend (`index.html`)
Verifique se a parte do envio no seu script está exatamente assim (garantindo que o `whatsapp` e a `url` entrem no `formData` corretamente):

```javascript
// Dentro do evento click do btnSendProof:
const formData = new FormData();
formData.append('whatsapp', wppValue); // Pega o valor do input do WhatsApp
formData.append('url', originalUrl);   // Pega a URL que o usuário colou no início
formData.append('comprovante', fileValue); // O arquivo do comprovante