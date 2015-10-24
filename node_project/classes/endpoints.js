var fs = require('fs');
var path = require('path');

exports.receiveImage = function (req, res) {
    //Received image, store at temp.png
    req.pipe(fs.createWriteStream('temp.png'));

    req.on('end', function() {
        //Image is now stored at temp.png
        res.send('Image received!');
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