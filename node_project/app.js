var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var fs = require('fs');
var Guid = require('guid');

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

app.post('/img', function (req, res) {
    // received image, store at <guid>.png
    var guid = Guid.create().toString();
    req.pipe(fs.createWriteStream(guid+'.png'));

    req.on('end', function() {
        // image is now stored at <guid>.png
        res.sendFile(__dirname+'/'+guid+'.png', function(){
            // remove the file
            fs.unlink(guid+'.png');
            console.log('Removed file');
        });
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