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
        //res.sendFile(__dirname+'/'+image+'.png', function(){
        //    // remove the file
        //    fs.unlink(image+'.png');
        //    console.log('Removed file');
        //});

        var image_location = 'http://dlym.net:3000/uploads/' + image + '.png';

        res.send({success: 'Image uploaded!'});
        //TODO Send image to image recognition & then results to clockwork location
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