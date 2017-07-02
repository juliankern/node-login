var security = require('../controllers/security');

module.exports = (app) => {
    app.get('/restricted', security.isLoggedin, (req, res) => {
        res.render('restricted');
    });
}