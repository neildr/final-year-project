const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const sassMiddleware = require('node-sass-middleware');
const session = require('client-sessions');
const fetch = require('node-fetch');

const app = express();

app.use(sassMiddleware({
    /* Options */
    src: path.join(__dirname, 'public/stylesheets/sass'),
    dest: path.join(__dirname, 'public/stylesheets'),
    debug: false,
    outputStyle: 'compressed',
    prefix:  '/stylesheets'
}));

app.use(session({
  cookieName: 'session',
  secret: 'BD4D9237CC871D4913221AF97792067962029427A6391089E47F86A32EA3F900',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

//file paths to js files
var index = require('./routes/index');

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//using routes
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
