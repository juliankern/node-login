module.exports = (route) => {
    route.get((req, res) => {
        req.logout();
        res.redirect('/');
    });
}