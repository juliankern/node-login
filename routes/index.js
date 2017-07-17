const i18n = require('i18n');
var routes = [];
var routeName;

module.exports = (router) => {
    // loads all subroutes in this directory
    require('../utils/loader.js').load(__dirname, (options, module, filename) => {
        routes = [];
        routeName = '/' + filename.replace(/\.js/, '');
        routes.push(router.route(i18n.__l(routeName)));
        
        options.forEach((o) => {
            routes.push(router.route(i18n.__l(routeName + o)));
        });

        module(...routes);
    });

    router.get('/', (req, res) => {
        res.render('index', { headline: res.__('Hauptseite') });
    });
}