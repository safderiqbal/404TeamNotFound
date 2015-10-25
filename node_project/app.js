var express = require('express');
var http = require('http');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var endpoints = require('./classes/endpoints');

var app = express();
var server =  http.createServer(app);

// all environments
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', endpoints.landingPage);
app.post('/image', endpoints.start);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
if (process.env.NODE_ENV === 'development') {
    app.use(errorHandler());
}

// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});