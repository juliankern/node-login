var config = require('../config.json');

var express = require('express');
var flash = require('connect-flash');
var app = express();
var router = express.Router();

var moment = require('moment');
var mongoose = require('mongoose');
var i18n = require("i18n");

require('dotenv').load();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB || 'mongodb://localhost/login-frame').then(
  () => { console.log('> Connection to DB successful'); },
  (err) => { console.error('>> Connection to DB failed!', err); process.exit(0); }
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

require('../controllers/security').init(app);

app.use(flash());

i18n.configure({
    locales: config.locale.list,
    defaultLocale: config.locale.default,
    directory: './locales',
    cookie: 'node-login-lang',
    syncFiles: true,
    objectNotation: true,
    autoReload: true
});

app.use(i18n.init);

app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        info: req.flash('info'),
        error: req.flash('error')
    };

    res.locals.formdata = req.flash('form')[0];
    res.locals.isLoggedin = req.isAuthenticated();
    res.locals.user = req.user;
    res.locals.date = {
        fromNow: (date, skipSuffix) => { return moment(date).fromNow(skipSuffix); },
        toNow: (date, skipPrefix) => { return moment(date).toNow(skipPrefix); }
    }

    res.locals.roles = config.roles;

    // if (res.locals.isLoggedin) {
    //     console.log('- Current user:', req.user);
    // }
    
    next();
});

require('../routes')(router);
app.use(router);

app.listen(3000, () => {
    console.log('> login-frame listening on port 3000!');
});