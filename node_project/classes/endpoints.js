var fs = require('fs');
var guid = require('guid');
var config = require('config');
var clockwork = require('clockwork')({key: config.get('keys.clockwork')});

exports.receiveImage = function (req, res) {
    var image = guid.create().toString();
    req.pipe(fs.createWriteStream('uploads/' +image+'.png'));

    req.on('end', function() {
        // //image is now stored at <image>.png
        console.log('Received image '+image + '.png');

        // send confirmation json
        res.json({
            status: 'success',
            url: 'http://dlym.net/hackmcr15/uploads/' + image + '.png'
        });
        
        // after 10 seconds, clean up the file
        //setTimeout(function() {
        //    fs.unlink('uploads/'+image+'.png');
        //    console.log('Removed image ' + image + '.png');
        //}, 10000);
    });
};

exports.test = function (req, res) {
    res.json(
        {
            response: 'something'
        }
    );
};