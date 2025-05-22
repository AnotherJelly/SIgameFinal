const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/SIgame', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB подключена'))
.catch(err => console.error('Ошибка подключения:', err));

const Round = mongoose.model('Round', new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    categories: [
        {
            id: { type: String, required: true },
            name: { type: String, required: true },
            questions: [
                {
                    id: { type: String, required: true },
                    questionType: { type: String, required: true },
                    text: { type: String, required: true },
                    answer: { type: String, required: true }
                }
            ]
        }
    ]
}));

app.get('/rounds', async (req, res) => {
    try {
        const rounds = await Round.find();
        res.json(rounds);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/rounds', async (req, res) => {
    try {
        await Round.deleteMany({});
        const newRounds = await Round.insertMany(req.body);
        res.status(201).json(newRounds);
    } catch (err) {
        console.error("Ошибка при сохранении:", err);
        res.status(400).json({ message: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Сервер работает на порту ${PORT}`);
});