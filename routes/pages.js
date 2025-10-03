/**
 * 🚀 ROTAS DE PÁGINAS (VIEWS)
 * =========================================
 * * Este arquivo contém todas as rotas que renderizam as páginas EJS (HTML dinâmico)
 * para o usuário final. Cada rota busca os dados necessários e os envia para o template.
 */

const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const { getConnectionStatus } = require('../config/database'); // Importa a função de status
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middleware/authMiddleware');

/**
 * PÁGINA INICIAL (com dados do DB)
 * =============
 * Rota: GET /
 * Descrição: Página principal que agora busca tarefas e o status do banco.
 */
router.get('/', async (req, res, next) => {
    try {
        console.log('🏠 Acessando página inicial (com dados do DB)...');
        const tasks = await Task.find().sort({ concluida: 1, createdAt: -1 }).lean();
        const dbStatus = getConnectionStatus(); // Pega o status atual do DB

        res.render('index', {
            title: 'Página Inicial',
            description: 'Este é um aplicativo híbrido desenvolvido para fins educacionais na Aula 1.',
            tasks: tasks,
            version: req.app.locals.appVersion,
            currentTime: new Date().toLocaleString('pt-BR'),
            dbStatus: dbStatus // Envia o status para a view
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

/**
 * PÁGINA SOBRE
 * ============
 * Rota: GET /sobre
 * Descrição: Página com informações sobre o projeto.
 */
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

/**
 * PÁGINA DE CONTATO
 * =================
 * Rota: GET /contato
 * Descrição: Página de contato.
 */
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
 * PÁGINA DE TAREFAS (COM ORDENAÇÃO CORRETA)
 * =========================================
 * Rota: GET /tarefas
 * Descrição: Busca as tarefas do banco e as ordena por:
 * 1. Status (pendentes primeiro)
 * 2. Prioridade (Alta > Média > Baixa)
 * 3. Data de criação (mais recentes primeiro)
 */
router.get('/tarefas', isAuthenticated, async (req, res) => { // <-- 2. APLIQUE O "SEGURANÇA" AQUI
    try {
        console.log('📋 Acessando página de tarefas (com ordenação aprimorada)...');
        
         // 3. ATUALIZE A CONSULTA PARA BUSCAR APENAS AS TAREFAS DO USUÁRIO LOGADO
        const tasks = await Task.aggregate([
            // Encontra apenas os documentos onde o campo 'user' é igual ao ID do usuário na sessão
            { $match: { user: new mongoose.Types.ObjectId(req.session.userId) } },
            
            // Etapa 1: Adicionar um campo numérico para a prioridade para podermos ordenar corretamente.
            {
                $addFields: {
                    priorityOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$prioridade", "Alta"] }, then: 3 },
                                { case: { $eq: ["$prioridade", "Média"] }, then: 2 },
                                { case: { $eq: ["$prioridade", "Baixa"] }, then: 1 }
                            ],
                            default: 2 // Se a prioridade for nula ou diferente, assume como Média.
                        }
                    }
                }
            },
            // Etapa 2: Ordenar pelos critérios na ordem correta.
            {
                $sort: {
                    concluida: 1,      // Tarefas não concluídas (false = 0) vêm antes das concluídas (true = 1).
                    priorityOrder: -1, // Ordena pela prioridade (3, 2, 1). O -1 significa ordem decrescente.
                    createdAt: -1      // Usa a data de criação como critério de desempate.
                }
            }
        ]);

        const pageData = {
            title: 'Gerenciador de Tarefas',
            description: 'Gerencie suas tarefas de forma simples e eficiente.',
            tasks: tasks
        };
        
        res.render('tarefas', pageData);

    } catch (error) {
        console.error("Erro ao buscar e ordenar tarefas:", error);
        res.status(500).render('tarefas', { 
            title: 'Erro no Servidor',
            description: 'Não foi possível carregar as tarefas no momento.',
            tasks: [], 
            error: "Não foi possível carregar as tarefas." 
        });
    }
});

/**
 * NOVA PÁGINA DE DASHBOARD
 * =========================
 * Rota: GET /dashboard
 * Descrição: Exibe estatísticas e um resumo das tarefas.
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        console.log('📊 Acessando página de dashboard...');
        
        const allTasks = await Task.find().lean();
        const latestTasks = await Task.find().sort({ createdAt: -1 }).limit(5).lean();

        const total = allTasks.length;
        const concluidas = allTasks.filter(t => t.concluida).length;
        const pendentes = total - concluidas;
        const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        const pageData = {
            title: 'Dashboard de Tarefas',
            description: 'Um resumo visual do progresso das suas tarefas.',
            stats: {
                total,
                concluidas,
                pendentes,
                percentual
            },
            latestTasks
        };

        res.render('dashboard', pageData);

    } catch (error) {
        console.error('Erro ao gerar dados para o dashboard:', error);
        next(error);
    }
});

/**
 * PÁGINA DE PRODUTOS
 * ==================
 * Rota: GET /produtos
 * Descrição: Página para gerenciar produtos (exemplo).
 */
router.get('/produtos', (req, res) => {
    const pageData = {
        title: 'Produtos',
        description: 'Conheça nossos produtos disponíveis em estoque.',
        produtos: [
            { id: 1, nome: 'Produto A', preco: 99.90, estoque: 10 },
            { id: 2, nome: 'Produto B', preco: 149.90, estoque: 5 },
            { id: 3, nome: 'Produto C', preco: 199.90, estoque: 0 },
            { id: 4, nome: 'Produto D', preco: 49.90, estoque: 22 }
        ]
    };
    res.render('produtos', pageData);
});


module.exports = router;