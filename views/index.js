const i18n = require('i18n');
var routes = [];
var routeName;

module.exports = (router) => {
    // loads all subroutes in this directory
    require('../utils/loader.js').load(__dirname, (options, module, filename) => {
        routes = [];
        routeName = filename.split('/').splice(-2, 1);
        routes.push(router.route(i18n.__l('path.' + routeName + '.base:' + routeName).map((r) => { return '/' + r; })));
        // console.log('routelist', i18n.__l('path.' + routeName + '.base:' + routeName).map((r) => { return '/' + r; }));
        
        options.forEach((o) => {
            routes.push(router.route(i18n.__l('path.' + routeName + '.' + o.replace(/\/(:*)/g, '') + ':' + routeName + o).map((r) => { return '/' + r; })));
        });

        module(...routes);
    });
    
    global.success('All routes loaded');

    router.get('/', (req, res) => {
        res.render('index/template', { headline: res.__('route.index.headline:Hauptseite') });
    });
}