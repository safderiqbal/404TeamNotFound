var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var fs = require('fs');

var app = express();
var server =  http.createServer(app);

// all environments
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());

app.get('/', function (req, res) {
    var json = {request: "/"};
    res.json(json);
});

app.get('/test', function (req, res) {
    var json = {request: "/test"};
    res.json(json);
});

app.get('/temp.png', function (req, res) {
    res.sendFile(__dirname+'/temp.png');
})

app.post('/img', function (req, res) {
    //Received image, store at temp.png
    req.pipe(fs.createWriteStream('temp.png'));

    req.on('end', function() {
        //Image is now stored at temp.png
        res.send('Image received!');
    });
});

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