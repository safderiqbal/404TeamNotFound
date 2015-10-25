var config = require('config');
var unirest = require('unirest');
var request = require('request');
var clockwork = require('clockwork')({key: config.get('keys.clockwork')});

var mashapeKey = config.get('keys.mashape');
var giphyKey = 'dc6zaTOxFJmzC';

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
    console.log('Calling giphy with ' + imageContents);
    var giphyPath = '/v1/gifs/search?q=' + imageContents.replace(/ /g, '%20') + '&api_key=' + giphyKey;
    request.get('http://api.giphy.com' + giphyPath, function (err, response, giphyResultStr) {
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

exports.start = function (req, res) {
    if (!req.body || !req.body.to || !req.body.from || !req.body.imageUrl) {
        res.status(400).send({error: 'Sorry, that wasn\'t a valid request. Be sure to include a `to`, `from` and `imageUrl` in your post'});
    }

    unirest.post('https://camfind.p.mashape.com/image_requests')
        .header('X-Mashape-Key', mashapeKey)
        .header('Content-Type', 'application/x-www-form-urlencoded')
        .header('Accept', 'application/json')
        .send('image_request[locale]=en_US')
        .send('image_request[remote_image_url]=' + req.body['imageUrl'])
        .end(function (result) {
            console.log('Sending...');
            console.log(result.status, result.headers, result.body);
            if (result.body.token) {
                exponentialBackOff(result.body.token, function(imageResult) {
                    // image identification successful - now get the result and call giphy api
                    var imageContents = imageResult.name;
                    getGiphy(imageContents, function(giphyResult) {
                        res.send(giphyResult);
                    });
                    //TODO Send links to gifs to requested number, via SMS
                });
            } else {
                res.status(400).send({ error: 'Sorry, the image recognition has a problem' });
            }
        });
};

exports.landingPage = function (req, res) {
    res.writeHeader(200, {'Content-Type': 'text\\html'});
    response.write('<h1>This is just an API!</h1><p>Try sending form data with a `to` (a valid UK mobile phone number),' +
        ' `from` (a valid UK mobile phone number), and `imageUrl` (a link to an image you wish to run, hosted online)</p>');
    response.end();
};