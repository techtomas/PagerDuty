
/**
 * Module dependencies.
 */
var config = require('./config');

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

var Mongoose = require('mongoose');
var models = require('./models');
var connection = Mongoose.createConnection('mongodb://' + config.mongodb.host + '/' + config.mongodb.db);
connection.on('connected', function () {
  console.log('Mongoose connection open');
});

connection.on('error',function (err) {
  console.log('Mongoose connection error: ' + err);
  process.exit(1);
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  connection.close(function () {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
  });
});

//DB Middleware to setup our connection and attach to the request
function db (req, res, next) {
  req.db = {
    Incident: connection.model("Incident", models.Incident)
  };
  return next();
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', db, routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});