module.exports = (app) => {
    // loads all subroutes in this directory
    require('../utils/loader.js').load(__dirname, app);

    app.get('/', (req, res) => {
        res.render('index');
    });
}