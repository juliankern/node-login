const i18n = require('i18n');
let routes = [];
let routeName;

module.exports = (router) => {
    // loads all subroutes in this directory
    global.req('utils/loader.js').load(__dirname, (options, module, filename) => {
        routes = [];
        // get the actual route name from directory
        routeName = filename.split('/').splice(-2, 1); 
        // add routes to router and routing array
        routes.push(router.route(i18n.__l('path.' + routeName + '.base:' + routeName).map((r) => { return '/' + r; })));
        
        // check if route has options, and add them as well
        options.forEach((o) => {
            routes.push(router.route(i18n.__l('path.' + routeName + '.' + o.replace(/\/(:*)/g, '') + ':' + routeName + o).map((r) => { return '/' + r; })));
        });

        // call route-module with her routers
        module(...routes);
    });
    
    global.success('All routes loaded');

    // basic index route
    router.get('/', (req, res) => {
        res.render('index/template', { headline: res.__('route.index.headline:Hauptseite') });
    });
}