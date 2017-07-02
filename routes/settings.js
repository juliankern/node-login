var security = require('../controllers/security');

module.exports = (app) => {
    app.get('/settings', security.isLoggedin, (req, res) => {
        res.render('settings', {
            user: req.user
        });
    });
}