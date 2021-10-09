"use strict";
var express = require('express');
// var path = require('path');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('dotenv').config();
var expressValidator = require('express-validator');
var helmet = require('helmet'); //Helmet helps you secure your Express apps by setting various HTTP headers
const CronJob = require('cron').CronJob;
const dailyEmail = require('./routes/dailyEmail.js');
var index = require('./routes/index');
const Sentry = require("@sentry/node");

var app = express();
app.locals.moment = require('moment');
// var config = require('./config.js').get(process.env.NODE_ENV);

app.use(helmet({
  frameguard: {
    action: 'deny'
  }
}))

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// if (app.get('env') === 'production') {
//   app.use(logger('combined'));
// } else {
  // app.use(logger('dev'));
// }
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
// app.set('trust proxy', 1);

// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use(express.static(__dirname + '/public'));

// app.use('/', (req, res) => {
//   console.log('hoola', req); 
//   res.render(index);
// });

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// //use in PRO
// if (app.get('env') === 'production') {
//   var port = process.env.PORT || 3000;
function runCron() {
  dailyEmail.runDailyCron();
}

const job = new CronJob({
  cronTime: '0 6 * * *', // run once a day at 6hs
  onTick: runCron,
  start: false,
  // setTime: ,
  timeZone: 'Europe/Paris',
});
job.start();

app.listen(3000, "0.0.0.0", function() {
  console.log("Listening on Port 3000");
});
// }

app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc) 
// var RateLimit = require('express-rate-limit');

// var limiter = new RateLimit(config.limiter);
// //  apply to all requests 
// app.use(limiter);

Sentry.init({ dsn: "https://da3b719c06604387b07bb864bce752cc@o440094.ingest.sentry.io/5408061" });
// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

module.exports = app;
