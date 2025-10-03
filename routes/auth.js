const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Importa o modelo de usuário que criamos
const { isGuest } = require('../middleware/authMiddleware');

// ============================================================================
//  ROTA DE CADASTRO (GET E POST)
// ============================================================================

// Rota para MOSTRAR o formulário de cadastro
router.get('/cadastro', isGuest, (req, res) => {
    res.render('cadastro', {
        title: 'Cadastro de Usuário',
        description: 'Crie sua conta para acessar o sistema.',
        layout: 'layout' // Garante que o layout principal seja usado
    });
});

// Rota para PROCESSAR o formulário de cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, telefone, email, password } = req.body;

        // Verifica se o e-mail já existe no banco de dados
        const userExists = await User.findOne({ email });
        if (userExists) {
            // Se o usuário já existe, retorna para a página de cadastro com um erro
            return res.render('cadastro', {
                title: 'Cadastro de Usuário',
                error: 'Este e-mail já está cadastrado.',
                nome, telefone, email // Devolve os dados para preencher o formulário novamente
            });
        }

        // Cria o novo usuário
        const newUser = new User({
            nome,
            telefone,
            email,
            password // A senha será criptografada automaticamente pelo hook 'pre-save' no modelo
        });

        await newUser.save();

        // Redireciona para a página de login com uma mensagem de sucesso
        res.redirect('/login?status=success');

    } catch (error) {
        // Se houver outro erro (ex: validação do modelo)
        res.render('cadastro', {
            title: 'Cadastro de Usuário',
            error: error.message || 'Ocorreu um erro ao tentar criar a conta.'
        });
    }
});

// ============================================================================
// ROTA DE LOGIN (GET E POST)
// ============================================================================

// Rota para MOSTRAR o formulário de login
router.get('/login', isGuest, (req, res) => { 
    res.render('login', {
        title: 'Login',
        description: 'Acesse sua conta.',
        layout: 'layout'
    });
});

// Rota para PROCESSAR o formulário de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Procura o usuário pelo e-mail
        const user = await User.findOne({ email });

        // Se o usuário não for encontrado OU a senha não bater...
        if (!user || !(await user.matchPassword(password))) {
            return res.render('login', {
                title: 'Login',
                error: 'E-mail ou senha inválidos.'
            });
        }

        // Se tudo estiver correto, armazena as informações do usuário na SESSÃO
        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.userName = user.nome;

        // Redireciona o usuário para a página de tarefas
        res.redirect('/tarefas');

    } catch (error) {
        res.render('login', {
            title: 'Login',
            error: 'Ocorreu um erro ao tentar fazer login.'
        });
    }
});


// ============================================================================
// ROTA DE LOGOUT
// ============================================================================
router.post('/logout', (req, res) => {
    // Destrói a sessão
    req.session.destroy(err => {
        if (err) {
            // Se houver um erro, apenas loga e continua
            console.error("Erro ao fazer logout:", err);
            return res.redirect('/');
        }
        
        // Limpa o cookie do navegador e redireciona para a home
        res.clearCookie('connect.sid'); // 'connect.sid' é o nome padrão do cookie da sessão
        res.redirect('/');
    });
});

module.exports = router;