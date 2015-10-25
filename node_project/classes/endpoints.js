var fs = require('fs');
var path = require('path');
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
            guid: guid
        });
        
        var image_location = 'http://dlym.net:3000/uploads/' + image + '.png';
        
        // after 10 seconds, clean up the file
        setTimeout(function() {
            fs.unlink('uploads/'+image+'.png');
            console.log('Removed image ' + image + '.png');
        }, 10000);
    });
};

exports.serveImage = function (req, res) {
    var fileLocation = path.join(path.dirname(require.main.filename), '/temp.png');
    if (fs.existsSync(fileLocation)) {
        res.sendFile(fileLocation);
    } else {
        res.status(400).send(
            {
                error: 'Sorry, a file does not exist'
            }
        )
    }
};

exports.test = function (req, res) {
    res.json(
        {
            response: 'something'
        }
    );
};