var security = require('../controllers/security');

module.exports = (route) => {
    route.get(
        security.isLoggedin, 
    (req, res) => {
        res.render('restricted', { headline: 'Restricted' });
    });
}