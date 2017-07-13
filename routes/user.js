var user = require('../controllers/user.js');
var security = require('../controllers/security');

module.exports = (app) => {
    app.get('/user', security.isLoggedin, async (req, res) => {
        res.render('userlist', { users: await user.get() });
    });
}