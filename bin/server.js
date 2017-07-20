var config = require('../config.json');
var chalk = require('chalk');

var path = require('path');
var express = require('express');
var flash = require('connect-flash');
var app = express();
var router = express.Router();

var moment = require('moment');
var mongoose = require('mongoose');
var i18n = require('i18n');

global.log = (arg1, ...args) => {
    console.log(chalk.bold.white(arg1), ...args);
}

global.success = (arg1, ...args) => {
    console.log(chalk.bold.green('> ' + arg1), ...args);
}

global.err = (arg1, ...args) => {
    console.log(chalk.bold.red('>> ' + arg1), ...args);
}

global.req = (modulepath) => {
    return require(path.resolve('./', modulepath));   
}

log('');
log('');
log('Application starting...');

require('dotenv').load();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB || 'mongodb://localhost/login-frame', { useMongoClient: true }).then(
  () => { success('Connection to DB successful'); },
  (err) => { err('Connection to DB failed!', err); process.exit(0); }
);


if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
}

app.set('view engine', 'pug');
app.set('views', './views');

app.use(require('express-session')({
    secret: 'keyboard cat',
    cookie: app.get('env') === 'production' ? { secure: true } : {},
    saveUninitialized: false,
    resave: true
}))

app.use(require('cookie-parser')());
app.use(express.static('public'));
app.use(require('body-parser').urlencoded({ extended: false }));

req('controllers/security').init(app);

app.use(flash());

app.use(i18n.init);
i18n.configure({
    locales: config.locale.list,
    defaultLocale: config.locale.default,
    directory: './locales',
    cookie: config.locale.cookiename,
    syncFiles: true,
    objectNotation: true,
    autoReload: true,
    queryParameter: 'lang'
});


app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        info: req.flash('info'),
        error: req.flash('error')
    };

    console.log('Request:', req.path);

    res.locals.formdata = req.flash('form')[0];
    res.locals.isLoggedin = req.isAuthenticated();
    res.locals.user = req.user;
    res.locals.date = {
        fromNow: (date, skipSuffix) => { return moment(date).fromNow(skipSuffix); },
        toNow: (date, skipPrefix) => { return moment(date).toNow(skipPrefix); }
    }

    res.locals.paths = {};
    res.locals.paths.template = '../../templates';

    res.locals.roles = config.roles;
    res.locals.locales = config.locale.list;

    if (req.query.lang) {
        res.cookie(config.locale.cookiename, req.query.lang);
        i18n.setLocale(req.query.lang);
    }

    // if (res.locals.isLoggedin) {
    //     console.log('- Current user:', req.user);
    // }
    
    next();
});

req('views')(router);
app.use(router);

app.listen(3000, () => {
    success('App listening on port 3000');
});