var fs = require('fs');
var guid = require('guid');
var config = require('config');
var unirest = require('unirest');
var clockwork = require('clockwork')({key: config.get('keys.clockwork')});

var mashapeKey = config.get('keys.mashape');

function exponentialBackOff(token, callback, wait, iterations) {
    wait = wait || 2000;
    iterations = iterations || 1;

    console.log('Attempt number ' + iterations + ' to find the result');

    if (iterations === 10) {
        return {
            "status": "failed",
            "reason": "Time out"
        }
    }
    unirest.get('https://camfind.p.mashape.com/image_responses/' + token)
        .header('X-Mashape-Key', mashapeKey)
        .header('Accept', 'application/json')
        .end(function (result) {
            console.log(result.status, result.headers, result.body);
            if (result.body.status === 'completed') {
                if (typeof callback === 'function') {
                    callback(result.body);
                }
            } else {
                console.log('Loop ' + iterations + 'failed');
                setTimeout((function () {
                    exponentialBackOff(token, callback, wait * 2, iterations + 1)
                }), wait);
            }
        });
}

exports.receiveImage = function (req, res) {
    var image = guid.create().toString();
    var numberToSendTo = req.headers['x-number-to-send-to'];

    req.pipe(fs.createWriteStream('uploads/' +image+'.png'));

    req.on('end', function() {
        //image is now stored at <image>.png
        console.log('Received image '+image + '.png');

        unirest.post('https://camfind.p.mashape.com/image_requests')
            .header('X-Mashape-Key', mashapeKey)
            .attach('image_request[image]', fs.createReadStream('uploads/' +image+'.png'))
            .field('image_request[locale]', 'en_US')
            .end(function (result) {
                console.log('Sending...');
                console.log(result.status, result.headers, result.body);
                if (result.body.token) {
                    fs.unlink('uploads/'+image+'.png');
                    console.log('Removed image ' + image + '.png');

                    exponentialBackOff(result.body.token, function(imageResult) {
                        res.send(imageResult);
                        //TODO Search Giphy API for results based on text received
                        //TODO Send links to gifs to requested number, via SMS
                    });
                } else {
                    res.status(400).send({ error: 'Sorry, the image recognition has a problem' });
                }
            });
    });
};

exports.test = function (req, res) {
    res.json(
        {
            response: 'something'
        }
    );
};