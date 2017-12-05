const socket = require('socket.io');
const express = require('express');
const twitter = require('node-tweet-stream');
const twitterConfig = require('./config.js');
const faceDetection = require('./face-detection.js');
const MA = require('moving-average');
const imageDownloader = require('image-downloader');
const fs = require('fs');
const findRemoveSync = require('find-remove')
const path = require('path');

// hourly
global.tweetCounter = 0;
var timeInterval = 3600 * 1000;
var ma = MA(timeInterval);

var trackerTerm = "fashionFace";
// create a twitter public stream
var client = new twitter(twitterConfig.config);

// express app
var app = express();

// setup server
var server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is listening on port ${process.env.PORT || 3000}`);
});

// middleware to serve static files (html, css, images, js and ..)
app.use(express.static('public'));

// Initialize socket.io
var io = socket.listen(server);

io.on("connection", (socket) => {
    // update tracker
    socket.on('updateTracker', (data) => {
        resetTweetParams();
        // update track term
        trackerTerm = data.trackerTerm;
        // start tracking new track term
        client.track(trackerTerm);
    });

    socket.on("deleteProcessedPicture", (data) => {
        var src = data.src;
        fs.unlink(path.join(__dirname, "public", src), function(err) {
            if (err) throw err;
            console.log("deleted image" + src);
        });

    });

});

client.on('tweet', function(tweet) {
    //console.log('tweet received', tweet);
    global.tweetCounter += 1;

    // calculate moving average
    setInterval(function() {
        ma.push(Date.now(), tweetCounter);
    });

    // get media/images array
    var media = tweet.entities.media;
    // check if it exists and there is something in there
    if (media != undefined && media.length > 0) {
        sendProcessImage(media, tweet);
    }
});


// track fashion face initially
client.track(trackerTerm);
// report error
client.on('error', function(err) {
    console.log('Something went wrong');
});

// reset params
function resetTweetParams() {
    global.tweetCounter = 0;
    // untrack previous track term
    client.untrack(trackerTerm);
};


function sendProcessImage(media, tweet) {

    for (i = 0; i < media.length; i++) {

        var imageOptions = {
            url: media[i].media_url_https,
            dest: path.join(__dirname, 'images')
        }

        imageDownloader.image(imageOptions)
            .then(({ filename, image }) => {
                // detect faces
                faceDetection.detectFaces(filename, function(err, data) {
                    // tweet the processed image
                    if (!err) {
                        io.emit('tweet', {
                            "tweet": tweet,
                            "fileUrl": data.fileUrl,
                            "fileName": data.fileName,
                            "trackerTerm": trackerTerm,
                            "tweetCounter": global.tweetCounter
                        });
                    }
                });

            }).catch((err) => {
                throw err
            });
    }
}

// cleanup images and processed images then kill the process
process.on('SIGINT', function() {
    server.close(() => {
        console.log("cleaning up images...");
        var result = findRemoveSync(path.join(__dirname, 'images'), { extensions: ['.jpg', '.png', '.jpeg'] });
        console.log("cleaning up processed images...");
        result = findRemoveSync(path.join(__dirname, 'public', 'processed_images'), { extensions: ['.jpg', '.png', '.jpeg'] });
        console.log("killing the process...");
        process.exit();
    });
});