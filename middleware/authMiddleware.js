// Este middleware é GLOBAL. Ele roda em todas as requisições para passar 
// informações da sessão para as views (arquivos .ejs).
const addUserToLocals = (req, res, next) => {
    // !! converte o valor para um booleano (true/false)
    console.log('VERIFICANDO A SESSÃO:', req.session); //
    
    // Passa os dados do usuário logado para as views
    res.locals.userIsLoggedIn = !!(req.session && req.session.userId); 
    res.locals.currentUserId = req.session.userId || null;
    res.locals.currentUserRole = req.session.userRole || null;
    res.locals.currentUserName = req.session.userName || null; // <-- O nome do usuário!
    
    next(); // Continua para a próxima função (seja outra middleware ou a rota)
};

// Este middleware é um "SEGURANÇA". Ele protege rotas, exigindo que o usuário esteja logado.
const isAuthenticated = (req, res, next) => {
    // Usa a variável que já foi definida pelo middleware global
    if (res.locals.userIsLoggedIn) {
        return next(); // Usuário logado? Pode passar.
    } else {
        res.redirect('/login'); // Não está logado? Vai para a página de login.
    }
};

// Este middleware é para "VISITANTES". Impede que usuários logados acessem páginas de login/cadastro.
const isGuest = (req, res, next) => {
    // Usa a variável que já foi definida pelo middleware global
    if (res.locals.userIsLoggedIn) {
        return res.redirect('/tarefas'); // Já está logado? Vai para a página de tarefas.
    }
    return next(); // É visitante? Pode passar.
};

module.exports = { 
    addUserToLocals, 
    isAuthenticated, 
    isGuest 
};