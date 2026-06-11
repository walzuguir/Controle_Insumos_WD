const express = require('express');
const cors = require('cors');
require('dotenv').config();

const insumos = require('./routes/insumos');
const filiais = require('./routes/filiais');
const movimentacoes = require('./routes/movimentacoes');
const auth = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/insumos', insumos);
app.use('/filiais', filiais);
app.use('/movimentacoes', movimentacoes);
app.use('/auth', auth);

app.get('/', (req, res) => {
  res.json({ message: 'API Controle de Insumos funcionando!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});