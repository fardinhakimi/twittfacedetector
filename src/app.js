
require('dotenv').config()

const express = require('express')
const twitter = require('node-tweet-stream')
const faceDetection = require('./face-detection.js')
const movingAverage = require('moving-average')
const imageDownloader = require('image-downloader')
const { unlinkSync} = require('fs')
const findRemoveSync = require('find-remove')
const config = require('./config.js')
const { basename , join} = require('path')
const app = express()
const client = new twitter(config.twitterConfig)

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})

app.use(express.static('public'))

const io = require('socket.io')(server);

var trackerTerm = "fashionFace"

// hourly

global.tweetCounter = 0
let timeInterval = 3600 * 1000
const ma = movingAverage(timeInterval)

const resetTweetParams = () => {
    global.tweetCounter = 0
    client.untrack(trackerTerm)
}

io.on("connection", (socket) => {

    socket.on('updateTracker', (data) => {
        resetTweetParams()
        trackerTerm = data.trackerTerm
        client.track(trackerTerm)
    })

    socket.on("deleteProcessedPicture", (data) => {
        unlinkSync(join(config.processed_images_path,basename(data.src)))
    })

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
})


const sendProcessImage =  async (images) => {

    images.forEach(async (image) => {

        const imageOptions = {
            url: image.media_url_https,
            dest: config.images_path
        }

        try {

            const {filename} = await imageDownloader.image(imageOptions)

            const {processedFileUrl, generatedFileName } = await faceDetection.detectFaces(filename)

            io.emit('tweet', {
                "fileUrl": processedFileUrl,
                "fileName":  generatedFileName,
                "trackerTerm": trackerTerm,
                "tweetCounter": global.tweetCounter
            })

            unlinkSync(filename)

        } catch (error) {
            console.log(error)
        }
    })
}

client.on('tweet', (tweet) => {

    global.tweetCounter += 1

    /* calculate moving average TODO
    setInterval(() => {
        ma.push(Date.now(), tweetCounter)
    })
    */

    let media = tweet.entities.media

    if (media !== undefined && media.length > 0) {
        sendProcessImage(media)
    }
})



// RUN PROGRAM AND LOG ERRORS

client.track(trackerTerm)

client.on('error', (err) => {
    console.log(" IO ERROR! ")
    console.log(err)
})

process.on('SIGINT', () => {

    server.close(() => {
        console.log("cleaning up images...")
        findRemoveSync(config.images_path, { extensions: ['.jpg', '.png', '.jpeg'] })
        console.log("cleaning up processed images...")
        findRemoveSync(config.processed_images_path, { extensions: ['.jpg', '.png', '.jpeg'] })
        console.log("killing the process...")
        process.exit()
    })
})