module.exports = (app) => {
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });
}