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
 * EXPORTAR PARA CSV para Excel BR)
 * ===========================
 * Rota: GET /api/tarefas/exportar
 */
router.get('/tarefas/exportar', async (req, res) => {
    try {
        const tarefas = await Task.find().lean();

        //  \uFEFF no início. Isso é o "BOM" (Byte Order Mark).
        // Excel aceita arquivo com acentos, use UTF-8!
        // Troquei vírgulas por ponto-e-vírgula (;) para o Excel separar colunas certinho.
        let csv = '\uFEFFID;Título;Descrição;Prioridade;Concluída;Categoria;Data de Criação\n';

        tarefas.forEach(t => {
            // Tratamento para evitar quebra se tiver ; dentro do texto do usuário
            const titulo = t.titulo ? `"${t.titulo.replace(/"/g, '""')}"` : '';
            const descricao = t.descricao ? `"${t.descricao.replace(/"/g, '""')}"` : '';
            const data = t.createdAt ? t.createdAt.toISOString() : '';
            const categoria = t.category || '';
            const prioridade = t.prioridade || '';
            const concluida = t.concluida ? 'Sim' : 'Não';

            // Use ; aqui também
            csv += `${t._id};${titulo};${descricao};${prioridade};${concluida};${categoria};${data}\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8'); // Reforça o charset
        res.attachment('tarefas.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao exportar CSV', error: error.message });
    }
});

/**
 * EXPORTAR JSON (DOWNLOAD FORÇADO)
 * ==========================================
 * Rota: GET /api/tarefas/exportar-json
 */
router.get('/tarefas/exportar-json', async (req, res) => {
    try {
        const tarefas = await Task.find();
        
        res.header('Content-Disposition', 'attachment; filename="tarefas.json"');
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(tarefas, null, 2));
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao exportar JSON', error: error.message });
    }
});

/**
 * RELATÓRIO ESTATÍSTICO
 * ===============================
 * Rota: GET /api/tarefas/relatorio
 */
router.get('/tarefas/relatorio', async (req, res) => {
    try {
        const total = await Task.countDocuments();
        
        // Agregação usando seus campos: 'prioridade' e 'category'
        const porPrioridade = await Task.aggregate([
            { $group: { _id: "$prioridade", count: { $sum: 1 } } }
        ]);

        const porCategoria = await Task.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        const concluidas = await Task.countDocuments({ concluida: true });
        const pendentes = await Task.countDocuments({ concluida: false });

        const ultimasTarefas = await Task.find().sort({ createdAt: -1 }).limit(10);

        res.json({
            success: true,
            data: {
                total_tarefas: total,
                tarefas_por_prioridade: porPrioridade,
                tarefas_por_categoria: porCategoria,
                status: { concluidas, pendentes },
                ultimas_10_criadas: ultimasTarefas
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório', error: error.message });
    }
});

/**
 * BACKUP COMPLETO
 * =========================
 * Rota: GET /api/tarefas/backup
 */
router.get('/tarefas/backup', async (req, res) => {
    try {
        const tarefas = await Task.find();
        // Extrai categorias únicas
        const categorias = [...new Set(tarefas.map(t => t.category).filter(c => c != null))];

        const backup = {
            metadata: {
                data_backup: new Date(),
                total_tarefas: tarefas.length,
                total_categorias: categorias.length
            },
            dados: {
                categorias: categorias,
                tarefas: tarefas
            }
        };

        res.json({ success: true, data: backup });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar backup', error: error.message });
    }
});

/**
 * CRIAR NOVA TAREFA (CREATE)
 * ===========================
 * Rota: POST /api/tarefas
 */
router.post('/tarefas', isAuthenticated, async (req, res) => {
    console.log('SESSÃO DENTRO DA API /POST TAREFAS:', req.session); 

    try {
        const { titulo, descricao, prioridade, category } = req.body;
        
        const newTask = new Task({
            titulo,
            descricao,
            prioridade,
            category,
            user: req.session.userId 
        });
        
        await newTask.save();
        // Se o populate der erro em algum momento, pode remover se não estiver usando a info do usuário na resposta imediata
        // await newTask.populate('user', 'nome'); 

        res.status(201).json({ success: true, data: newTask });
    } catch (error) {
        console.error('💥 ERRO AO SALVAR TAREFA:', error.message); 
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * IMPORTAR TAREFAS EM MASSA
 * ===================================
 * Rota: POST /api/tarefas/importar
 * Obs: Coloquei isAuthenticated para garantir que as tarefas tenham dono
 */
router.post('/tarefas/importar', isAuthenticated, async (req, res) => {
    try {
        const listaTarefas = req.body;

        if (!Array.isArray(listaTarefas)) {
            return res.status(400).json({ success: false, message: 'O corpo deve ser um array.' });
        }

        let criadas = 0;
        let falhas = 0;
        const erros = [];

        for (const item of listaTarefas) {
            // Valida se tem título (seu campo obrigatório principal)
            if (!item.titulo) {
                falhas++;
                erros.push({ item, motivo: 'Campo titulo ausente' });
                continue;
            }

            try {
                await Task.create({
                    titulo: item.titulo,
                    descricao: item.descricao,
                    prioridade: item.prioridade,
                    category: item.category,
                    concluida: item.concluida || false,
                    user: req.session.userId // Atribui ao usuário logado
                });
                criadas++;
            } catch (err) {
                falhas++;
                erros.push({ item, motivo: err.message });
            }
        }

        res.json({
            success: true,
            message: 'Importação finalizada',
            resumo: { criadas, falhas },
            erros: erros.length > 0 ? erros : undefined
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro na importação', error: error.message });
    }
});

/**
 * ATUALIZAR TAREFA EXISTENTE (UPDATE)
 * ====================================
 * Rota: PUT /api/tarefas/:id
 */
router.put('/tarefas/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada.' });
        }

        const userIsAdmin = req.session.userRole === 'admin';
        const userIsOwner = task.user.toString() === req.session.userId;

        if (!userIsAdmin && !userIsOwner) {
            return res.status(403).json({ success: false, message: 'Acesso negado.' });
        }

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
 */
router.delete('/tarefas/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada.' });
        }

        const userIsAdmin = req.session.userRole === 'admin';
        const userIsOwner = task.user.toString() === req.session.userId;

        if (!userIsAdmin && !userIsOwner) {
            return res.status(403).json({ success: false, message: 'Acesso negado.' });
        }
        
        await Task.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Tarefa excluída com sucesso.' });
    } catch(error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;