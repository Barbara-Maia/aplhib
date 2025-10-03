// Este middleware verifica se o usuário está logado
const isAuthenticated = (req, res, next) => {
    // A variável `userIsLoggedIn` fica disponível em todas as views
    // Isso é útil para mostrar/esconder botões de Login/Logout
    res.locals.userIsLoggedIn = req.session && req.session.userId;

    if (res.locals.userIsLoggedIn) {
        // Se o userId existe na sessão, o usuário está logado.
        return next(); // Pode prosseguir para a rota solicitada.
    } else {
        // Se não estiver logado, redireciona para a página de login.
        res.redirect('/login');
    }
};

// Este middleware é o oposto: se o usuário já está logado,
// ele o impede de acessar as páginas de login e cadastro novamente.
const isGuest = (req, res, next) => {
    res.locals.userIsLoggedIn = req.session && req.session.userId;

    if (res.locals.userIsLoggedIn) {
        return res.redirect('/tarefas'); // Se já está logado, vai para as tarefas
    }
    return next(); // Se não, pode prosseguir para login/cadastro
}

module.exports = { isAuthenticated, isGuest };