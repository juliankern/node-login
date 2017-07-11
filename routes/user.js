var user = require('../controllers/user.js');

module.exports = (app) => {
    app.get('/user', async (req, res) => {
        res.render('userlist', { users: await user.get() });
    });
}