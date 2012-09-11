/**
 * Module dependencies.
 */
var express = require('express'),
    http = require('http'),
    path = require('path'),
    routes = require('./routes');

var app = express();

/**
 * Configure express app.
 */
app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

/**
 * Routes
 * Callback functions are defined in routes/index.js
 */
app.get('/', routes.index);
app.get(/\/server[s]{0,1}$/, routes.servers);
app.get('/status', routes.status);
app.get('/status/:host', routes.status_host);

/**
 * Start http server.
 */
http.createServer(app).listen(app.get('port'), function () {
  console.log("Spawnfrag server listening on port " + app.get('port'));
});