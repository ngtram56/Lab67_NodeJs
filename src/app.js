const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressHdb = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit')

const indexRouter = require('./routes/index');

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CSRF middleware
app.use(cookieParser())
app.use(csrf({ cookie: true }))

// view engine setup
app.engine('hbs', expressHdb.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        ifeq: function (val1, val2) {
            return (val1 === val2);
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    var token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token);
    res.locals.csrfToken = token;
    next();
});



app.use(session({
    secret: 'secret',
    cookie: { maxAge: 3 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}));
// flash module
app.use(flash({ sessionKeyName: 'flashMessage' }));

// Rate limit module
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windows
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // disable the `X-RateLimit-*` headers
});
app.use(limiter);


// setup route
indexRouter(app);

// Set routes error for wrong paths
app.use((req, res) => {
    res.redirect('/error');
});

app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`)
});