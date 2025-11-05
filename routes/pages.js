/**
 * 🚀 ROTAS DE PÁGINAS (VIEWS)
 * =========================================
 * * Este arquivo contém todas as rotas que renderizam as páginas EJS (HTML dinâmico)
 * para o usuário final. Cada rota busca os dados necessários e os envia para o template.
 */

const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const { getConnectionStatus } = require('../config/database');
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middleware/authMiddleware');

// ... (Rotas GET /, /sobre, /contato permanecem iguais) ...
router.get('/', async (req, res, next) => {
    try {
        console.log('🏠 Acessando página inicial (com dados do DB)...');
        const tasks = await Task.find().sort({ concluida: 1, createdAt: -1 }).lean();
        const dbStatus = getConnectionStatus();
        res.render('index', {
            title: 'Página Inicial',
            description: 'Este é um aplicativo híbrido desenvolvido para fins educacionais na Aula 1.',
            tasks: tasks,
            version: req.app.locals.appVersion,
            currentTime: new Date().toLocaleString('pt-BR'),
            dbStatus: dbStatus
        });
    } catch (error) {
        console.error('Erro ao buscar dados para a página inicial:', error);
        const dbStatus = getConnectionStatus();
        res.render('index', {
            title: 'Página Inicial',
            description: 'Ocorreu um erro ao carregar as tarefas.',
            tasks: [],
            version: req.app.locals.appVersion,
            currentTime: new Date().toLocaleString('pt-BR'),
            dbStatus: dbStatus
        });
    }
});
router.get('/sobre', (req, res) => {
    console.log('ℹ️ Acessando página sobre...');
    const pageData = {
        title: 'Sobre o Projeto',
        description: 'Informações detalhadas sobre a arquitetura e tecnologias do projeto.',
        features: [
            'Interface moderna e responsiva',
            'Backend com Node.js e Express',
            'API REST completa para gerenciamento de tarefas',
            'Conexão com banco de dados MongoDB',
            'Sistema de rotas organizado'
        ],
        technologies: [
            'Node.js',
            'Express.js',
            'MongoDB & Mongoose',
            'EJS (Embedded JavaScript templates)',
            'CSS Custom Properties'
        ]
    };
    res.render('sobre', pageData);
});
router.get('/contato', (req, res) => {
    console.log('📞 Acessando página de contato...');
    const pageData = {
        title: 'Contato',
        description: 'Entre em contato conosco para mais informações.',
        contactInfo: {
            email: 'professor@exemplo.com',
            telefone: '(21) 99999-9999',
            endereco: 'Universidade de Vassouras'
        }
    };
    res.render('contato', pageData);
});


/**
 * PÁGINA DE TAREFAS (LÓGICA COLABORATIVA)
 * =========================================
 * Rota: GET /tarefas
 * Descrição: Busca as tarefas do banco de dados (Apenas Categoria: Tarefa)
 */
router.get('/tarefas', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.aggregate([
            { $match: { category: 'Tarefa' } },
            // MODIFICADO: Corrigida a sintaxe do $lookup
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { user: '$userDetails' } },
            {
                $addFields: {
                    priorityOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$prioridade", "Alta"] }, then: 3 },
                                { case: { $eq: ["$prioridade", "Média"] }, then: 2 },
                                { case: { $eq: ["$prioridade", "Baixa"] }, then: 1 }
                            ],
                            default: 2
                        }
                    }
                }
            },
            { $sort: { concluida: 1, priorityOrder: -1, createdAt: -1 } }
        ]);

        res.render('tarefas', {
            title: 'Minhas Tarefas',
            description: 'Acompanhe todas as suas tarefas.',
            tasks: tasks,
            layout: 'layout'
        });

    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
        res.status(500).render('500', { 
            title: 'Erro de Servidor', 
            description: 'Ocorreu um erro interno.' 
        });
    }
});


// =========================================
// NOVAS ROTAS DE CATEGORIAS
// =========================================

/**
 * PÁGINA MEU TCC
 * =========================================
 * Rota: GET /tcc
 * Descrição: Busca os itens da categoria "Meu TCC"
 */
router.get('/tcc', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.aggregate([
            { $match: { category: 'Meu TCC' } },
            // MODIFICADO: Corrigida a sintaxe do $lookup
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { user: '$userDetails' } },
            {
                $addFields: {
                    priorityOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$prioridade", "Alta"] }, then: 3 },
                                { case: { $eq: ["$prioridade", "Média"] }, then: 2 },
                                { case: { $eq: ["$prioridade", "Baixa"] }, then: 1 }
                            ],
                            default: 2
                        }
                    }
                }
            },
            { $sort: { concluida: 1, priorityOrder: -1, createdAt: -1 } }
        ]);

        res.render('tarefas', {
            title: 'Meu TCC',
            description: 'Acompanhe o progresso do seu TCC.',
            tasks: tasks,
            layout: 'layout'
        });

    } catch (error) {
        console.error("Erro ao buscar itens de TCC:", error);
        res.status(500).render('500', { 
            title: 'Erro de Servidor', 
            description: 'Ocorreu um erro interno.' 
        });
    }
});

/**
 * PÁGINA TRABALHO
 * =========================================
 * Rota: GET /trabalho
 * Descrição: Busca os itens da categoria "Trabalho"
 */
router.get('/trabalho', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.aggregate([
            { $match: { category: 'Trabalho' } },
            // MODIFICADO: Corrigida a sintaxe do $lookup
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { user: '$userDetails' } },
            {
                $addFields: {
                    priorityOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$prioridade", "Alta"] }, then: 3 },
                                { case: { $eq: ["$prioridade", "Média"] }, then: 2 },
                                { case: { $eq: ["$prioridade", "Baixa"] }, then: 1 }
                            ],
                            default: 2
                        }
                    }
                }
            },
            { $sort: { concluida: 1, priorityOrder: -1, createdAt: -1 } }
        ]);

        res.render('tarefas', {
            title: 'Trabalho',
            description: 'Acompanhe suas pendências do trabalho.',
            tasks: tasks,
            layout: 'layout'
        });

    } catch (error) {
        console.error("Erro ao buscar itens de Trabalho:", error);
        res.status(500).render('500', { 
            title: 'Erro de Servidor', 
            description: 'Ocorreu um erro interno.' 
        });
    }
});

/**
 * PÁGINA CARRO (MODIFICADO)
 * =========================================
 * Rota: GET /carro
 * Descrição: Busca os itens da categoria "Carro"
 */
router.get('/carro', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.aggregate([
            { $match: { category: 'Carro' } },
            // MODIFICADO: Corrigida a sintaxe do $lookup
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { user: '$userDetails' } },
            {
                $addFields: {
                    priorityOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$prioridade", "Alta"] }, then: 3 },
                                { case: { $eq: ["$prioridade", "Média"] }, then: 2 },
                                { case: { $eq: ["$prioridade", "Baixa"] }, then: 1 }
                            ],
                            default: 2
                        }
                    }
                }
            },
            { $sort: { concluida: 1, priorityOrder: -1, createdAt: -1 } }
        ]);

        res.render('tarefas', { 
            title: 'Manutenção do Carro',
            description: 'Acompanhe seus itens de manutenção.',
            tasks: tasks,
            layout: 'layout'
        });

    } catch (error) {
        console.error("Erro ao buscar itens de Carro:", error);
        res.status(500).render('500', { 
            title: 'Erro de Servidor', 
            description: 'Ocorreu um erro interno.' 
        });
    }
});


/**
 * NOVA PÁGINA DE DASHBOARD
 * =========================
 * Rota: GET /dashboard
 * Descrição: Exibe estatísticas e um resumo das tarefas.
 */
router.get('/dashboard', isAuthenticated, async (req, res, next) => {
    try {
        console.log('📊 Acessando página de dashboard...');
        
        const allTasks = await Task.find().lean();
        const latestTasks = await Task.find().sort({ createdAt: -1 }).limit(5).lean();

        const total = allTasks.length;
        const concluidas = allTasks.filter(t => t.concluida).length; // Nome da variável
        const pendentes = total - concluidas;
        
        // MODIFICADO: Corrigido o nome da variável de 'concluida' para 'concluidas'
        const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        const pageData = {
            title: 'Dashboard de Tarefas',
            description: 'Um resumo visual do progresso das suas tarefas.',
            stats: {
                total,
                concluidas, // Nome da variável
                pendentes,
                percentual
            },
            latestTasks
        };

        res.render('dashboard', pageData);

    } catch (error) {
        console.error('Erro ao gerar dados para o dashboard:', error);
        res.status(500).render('500', { 
            title: 'Erro de Servidor', 
            description: 'Ocorreu um erro interno.' 
        });
    }
});

module.exports = router;