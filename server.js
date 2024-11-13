const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

const userData = new Map();
const userIdentifiedData = new Map();

const SECRET_KEY = 'seu_segredo_super_secreto'; // Em produção, armazene isso em uma variável de ambiente

// Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Dados por Usuário com Autenticação',
            version: '1.0.0',
            description: 'API que recebe e armazena dados em memória por usuário logado com autenticação via token.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./app.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica o usuário e retorna um token JWT
 *     parameters:
 *       - in: body
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome de usuário
 *     responses:
 *       200:
 *         description: Token JWT retornado com sucesso
 */
app.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).send({ message: 'Nome do usuário é obrigatório' });
    }
    // Cria um token
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.send({ token });
});

// Middleware para verificar o token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

/**
 * @swagger
 * /saveData:
 *   post:
 *     summary: Salva dados para o usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *         description: Dados a serem salvos
 *     responses:
 *       200:
 *         description: Dados salvos com sucesso
 */
app.post('/saveData', authenticateToken, (req, res) => {
    const userId = req.user.username;
    const { data } = req.body;
    if (!userData.has(userId)) {
        userData.set(userId, []);
    }
    userData.get(userId).push(data);
    res.send({ message: 'Dados salvos com sucesso!' });
});

/**
 * @swagger
 * /getData:
 *   get:
 *     summary: Recupera dados salvos para o usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados retornados com sucesso
 */
app.get('/getData', authenticateToken, (req, res) => {
    const userId = req.user.username;
    res.send(userData.get(userId) || []);
});


//lógica com incrementação
app.post('/identified/saveData', authenticateToken, (req, res) => {
    const userId = req.user.username;
    const data = req.body;
    if (!userIdentifiedData.has(userId)) {
        userIdentifiedData.set(userId, []);
    }
    var id = userIdentifiedData.get(userId).length + 1
    userIdentifiedData.get(userId).push({
        "id": id,
        "data": data
    });
    res.send({ message: 'Dados salvos com sucesso!' });
});

app.get('/identified/getData', authenticateToken, (req, res) => {
    const userId = req.user.username;
    res.send(userIdentifiedData.get(userId) || []);
});

app.get('/identified/getData/:dataId', authenticateToken, (req, res) => {
    const userId = req.user.username;
    const dataId = req.params.dataId
    const data = userIdentifiedData.get(userId).find( data => data.id == dataId)
    res.send(data);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
