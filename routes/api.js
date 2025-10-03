/**
 * 🚀 AULA 1 - ROTAS DE API
 * =========================================
 * * Este arquivo contém todas as rotas da API REST da nossa aplicação.
 * Os endpoints aqui definidos são responsáveis pela comunicação com o frontend
 * e pela manipulação dos dados no banco de dados.
 */

const express = require('express');
const router = express.Router();
const Task = require('../models/task'); // Importa o modelo de Tarefa
const { isAuthenticated } = require('../middleware/authMiddleware');

/**
 * STATUS DA API
 * =============
 * Rota: GET /api/status
 * Descrição: Retorna informações sobre o status da API, útil para health checks.
 */
router.get('/status', (req, res) => {
    console.log('📊 Verificando status da API...');
    
    const status = {
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };
    
    res.json({ success: true, data: status });
});


// --- ROTAS DE TAREFAS (CRUD - Create, Read, Update, Delete) ---

/**
 * LISTAR TODAS AS TAREFAS (READ)
 * ==============================
 * Rota: GET /api/tarefas
 * Descrição: Retorna a lista de tarefas do banco de dados, ordenadas.
 */
router.get('/tarefas', async (req, res) => {
    console.log('📋 Listando tarefas do banco de dados...');
    try {
        // Busca as tarefas, ordenando por concluídas (false primeiro) e depois pela data de criação (mais recentes primeiro)
        const tasks = await Task.find().sort({ concluida: 1, createdAt: -1 });
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error("Erro ao listar tarefas:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor ao buscar tarefas.' });
    }
});

/**
 * CRIAR NOVA TAREFA (CREATE)
 * ===========================
 * Rota: POST /api/tarefas
 * Descrição: Cria uma nova tarefa no banco de dados.
 */
router.post('/tarefas', isAuthenticated, async (req, res) => {
    try {
        const { titulo, descricao, prioridade } = req.body;
        const newTask = new Task({
            titulo,
            descricao,
            prioridade,
            user: req.session.userId // <-- VINCULA A NOVA TAREFA AO USUÁRIO LOGADO
        });
        await newTask.save();
        res.status(201).json({ success: true, data: newTask });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * ATUALIZAR TAREFA EXISTENTE (UPDATE)
 * ====================================
 * Rota: PUT /api/tarefas/:id
 * Descrição: Atualiza uma tarefa existente no banco de dados.
 */
router.put('/tarefas/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.session.userId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada ou não pertence a você.' });
        }
        // Atualiza apenas os campos enviados no corpo da requisição
        Object.assign(task, req.body);
        await task.save();
        res.json({ success: true, data: task });
    } catch(error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * DELETAR TAREFA (DELETE)
 * ========================
 * Rota: DELETE /api/tarefas/:id
 * Descrição: Deleta uma tarefa do banco de dados.
 */
router.delete('/tarefas/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada ou não pertence a você.' });
        }
        res.json({ success: true, message: 'Tarefa excluída com sucesso.' });
    } catch(error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- ROTAS DE EXEMPLO (PRODUTOS) ---

const produtos = [
    { id: 1, nome: 'Produto A', preco: 99.90, estoque: 10 },
    { id: 2, nome: 'Produto B', preco: 149.90, estoque: 5 },
    { id: 3, nome: 'Produto C', preco: 199.90, estoque: 0 },
];
router.get('/produtos', (req, res) => {
    res.json({ success: true, data: produtos });
});
router.get('/produtos/:id', (req, res) => {
    const produto = produtos.find(p => p.id == req.params.id);
    if (produto) {
        res.json({ success: true, data: produto });
    } else {
        res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }
});


module.exports = router;