var http = require('http');
var fs = require('fs');
var guid = require('guid');
var config = require('config');
var unirest = require('unirest');
var request = require('request');
var clockwork = require('clockwork')({key: config.get('keys.clockwork')});

var mashapeKey = config.get('keys.mashape');
var giphyKey = config.get('keys.giphy');

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
                console.log('Loop ' + iterations + ' failed');
                setTimeout((function () {
                    exponentialBackOff(token, callback, wait * 2, iterations + 1)
                }), wait);
            }
        });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getGiphy(imageContents, callback) {
    // call the giphy api
    console.log('Calling giphy with '+imageContents);
    var giphyPath = '/v1/gifs/search?q=' + imageContents.replace(/ /g,'%20') + '&api_key=' + giphyKey;
    request.get('http://api.giphy.com' + giphyPath, function(err, response, giphyResultStr) {
        // giphy result got - if no values, remove a random part of the string and make a new request
        var giphyResult = JSON.parse(giphyResultStr);

        if (giphyResult.pagination.count !== 0) {
            callback(giphyResult);
        }
        else {
            var imageContentsArray = imageContents.split(' ');
            if (imageContentsArray.length === 1) {
                getGiphy('doctor who tv sad pout', callback);
            }
            else {
                var removedIndex = getRandomInt(0, imageContentsArray.length);
                var newContents = imageContentsArray.splice(removedIndex, 1).join(' ');
                getGiphy(newContents, callback);
            }
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
                    // delete the stored image from the server and keep checking mashape for result
                    fs.unlink('uploads/'+image+'.png');
                    console.log('Removed image ' + image + '.png');
                    exponentialBackOff(result.body.token, function(imageResult) {
                        // image identification successful - now get the result and call giphy api
                        var imageContents = imageResult.name;
                        getGiphy(imageContents, function(giphyResult) {
                            // giphy results get - now we need to extract them
                            // only one result at the moment, something to expand on if there's time
                            var gifString = giphyResult.data[0].images.original.url;
                            res.send(gifString);
                        });
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