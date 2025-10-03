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
router.post('/tarefas', async (req, res) => {
    console.log('➕ Criando nova tarefa no banco de dados...');
    try {
        // Task.create usa o req.body inteiro, e o Mongoose Schema valida os dados.
        // Se 'titulo' faltar, o Mongoose gerará um erro que será capturado pelo catch.
        const newTask = await Task.create(req.body);
        res.status(201).json({ success: true, data: newTask });
    } catch (error) {
        // Erros de validação do Mongoose geralmente resultam em status 400.
        console.error("Erro ao criar tarefa:", error);
        res.status(400).json({ success: false, message: 'Dados inválidos. Verifique os campos enviados.', error: error.message });
    }
});

/**
 * ATUALIZAR TAREFA EXISTENTE (UPDATE)
 * ====================================
 * Rota: PUT /api/tarefas/:id
 * Descrição: Atualiza uma tarefa existente no banco de dados.
 */
router.put('/tarefas/:id', async (req, res) => {
    console.log(`🔄 Atualizando tarefa ${req.params.id}...`);
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // {new: true} retorna o documento atualizado
        );

        if (!updatedTask) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        res.json({ success: true, data: updatedTask });
    } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
        res.status(400).json({ success: false, message: 'Erro ao atualizar a tarefa.', error: error.message });
    }
});

/**
 * DELETAR TAREFA (DELETE)
 * ========================
 * Rota: DELETE /api/tarefas/:id
 * Descrição: Deleta uma tarefa do banco de dados.
 */
router.delete('/tarefas/:id', async (req, res) => {
    console.log(`🗑️ Deletando tarefa ${req.params.id}...`);
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);

        if (!deletedTask) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        res.json({ success: true, message: `Tarefa deletada com sucesso!`, data: {} });
    } catch (error) {
        console.error("Erro ao deletar tarefa:", error);
        res.status(500).json({ success: false, message: 'Erro no servidor ao deletar a tarefa.' });
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