const config = global.config = require('../config.json');
const chalk = require('chalk');

const moment = require('moment');
const i18n = require('i18n');
const mongoose = require('mongoose');
const path = require('path');
const express = require('express');

const app = express();
const router = express.Router();

mongoose.Promise = global.Promise;

// add global functions
Object.assign(global, {
    approot: path.resolve('./'),
    req: (modulepath) => {
        // custom require to handle relative paths from project root
        return require(path.resolve('./', modulepath));   
    },
    success: (arg1, ...args) => {
        // custom success logger with fancy arrows and green color
        console.log(chalk.bold.green('> ' + arg1), ...args);
    },
    log: (arg1, ...args) => {
        // custom info logger with color
        console.log(chalk.bold.cyan(arg1), ...args);
    },
    warn: (arg1, ...args) => {
        // custom info logger with color
        console.log(chalk.bold.yellowBright('!! ' + arg1), ...args);
    },
    error: (arg1, ...args) => {
        // custom error logger with red color
        console.log(chalk.bold.redBright('>> ' + arg1), ...args);
    }
});

global.log('');
global.log('');

if (process.title === 'npm' && require('os').type().includes('Windows')) {
    global.warn('You need to run "npm run watch-scss" as well, to compile CSS!');
    global.log('');
}

if (+process.version.replace('v', '').split('.')[0] < 8) {
    global.error('You need to upgrade to NodeJS 8 to run this application!');
    process.exit(1);
}

global.log('Application starting...');

require('dotenv').load();

mongoose.connect(process.env.MONGODB || 'mongodb://localhost/login-frame', { useMongoClient: true }).then(
    () => { global.success('Connection to DB successful'); },
    (err) => { global.error('Connection to DB failed!', err); process.exit(0); }
);

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
}

app.set('view engine', 'pug');
app.set('views', './views');

app.use(require('cookie-parser')());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(require('body-parser').urlencoded({ extended: false }));
app.use(require('express-fileupload')());

// init security features here
global.req('controllers/security').init(app);

app.use(require('connect-flash')());

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
    // handle some app specific data

    // add error/siccess/info messages to templates 
    Object.assign(res.locals, {
        messages: {
            success: req.flash('success'),
            info: req.flash('info'),
            error: req.flash('error')
        },
        formdata: req.flash('form')[0]
    });

    global.log('Request:', req.path);

    // add login check to templates
    res.locals.isLoggedin = req.isAuthenticated();
    // add userdata to templates
    res.locals.user = req.user;
    // add date handling functions to userdata
    res.locals.date = {
        fromNow: (date, skipSuffix) => { return moment(date).fromNow(skipSuffix); },
        toNow: (date, skipPrefix) => { return moment(date).toNow(skipPrefix); }
    }

    // transform error array to flashes
    req.arrayFlash = (array, type) => {
        array.forEach((err) => {
            req.flash(type, err);
        });
    };

    if (Object.keys(req.body).length > 0) {
        req.flash('form', req.body);
    }

    // add app data to templates
    res.locals.app = config.app;
    // add role data to templates
    res.locals.roles = config.roles;
    // add locale list to templates
    res.locals.locales = config.locale.list;

    // write locale to cookie if changed by user
    if (req.query.lang) {
        res.cookie(config.locale.cookiename, req.query.lang);
        i18n.setLocale(req.query.lang);
    }

    // add error fields to templates
    if (res.locals.messages.error && res.locals.messages.error.length > 0) {
        res.locals.fields = [];
        res.locals.messages.error.forEach((err) => {
            res.locals.fields = res.locals.fields.concat(err.fields);
        });
    }

    next();
});

// load all routes here
global.req('views')(router);
app.use(router);

const server = app.listen(process.env.PORT || 3000, () => {
    global.success('App listening on port ' + server.address().port);
});