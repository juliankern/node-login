var express = require('express');
var flash = require('connect-flash');
var app = express();

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/login-frame').then(
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

app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        info: req.flash('info'),
        error: req.flash('error')
    };

    res.locals.formdata = req.flash('form')[0];
    res.locals.isLoggedin = req.isAuthenticated();
    res.locals.user = req.user;

    // if (res.locals.isLoggedin) {
    //     console.log('- Current user:', req.user);
    // }
    
    next();
});

require('../routes')(app);

app.listen(3000, () => {
    console.log('> login-frame listening on port 3000!');
});