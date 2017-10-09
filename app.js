var express = require('express');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');


//mongodb://moshik.tsadok:chiko301@ds163494.mlab.com:63494/empiricalhire
//mongodb://emphireDB:nD9yncX1bf@ds115035.mlab.com:15035/empiricalhire
var index = require('./routes/index');

/* LOCAL */
/*
mongoose.connect('mongodb://127.0.0.1/candidateLocal', {
    useMongoClient: true
});
// old mLab
//mongoose.connect('mongodb://moshik.tsadok:chiko301@ds163494.mlab.com:63494/empiricalhire', {
/*  mLAB */
mongoose.connect('mongodb://emphireDB:nD9yncX1bf@ds115035.mlab.com:15035/empiricalhire', {
    useMongoClient: true
});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to mongodb!");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser({uploadDir:'/uploads'}));
//app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
