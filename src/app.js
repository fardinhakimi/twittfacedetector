const socket = require('socket.io')
const express = require('express')
const twitter = require('node-tweet-stream')
const faceDetection = require('./face-detection.js')
const MA = require('moving-average')
const imageDownloader = require('image-downloader')
const { unlink } = require('fs')
const findRemoveSync = require('find-remove')
const path = require('path')
require('dotenv').config()
const config = require('./config.js')

const app = express()
const client = new twitter(config.twitterConfig)

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})


app.use(express.static('public'))

// Initialize socket.io
const io = socket.listen(server)

// tracker term
var trackerTerm = "fashionFace"

// hourly
global.tweetCounter = 0
let timeInterval = 3600 * 1000
const ma = MA(timeInterval)


io.on("connection", (socket) => {

    socket.on('updateTracker', (data) => {
        resetTweetParams()
        trackerTerm = data.trackerTerm
        client.track(trackerTerm)
    })

    socket.on("deleteProcessedPicture", (data) => {

        unlink(path.join(__dirname, "public", data.src), (err) => {

            if (err) {
                throw err
            }

            console.log("deleted image" + data.src)
        })
    })
})

client.on('tweet', (tweet) => {

    console.log(tweet); exit();

    global.tweetCounter += 1

    // calculate moving average // TODO
    setInterval(() => {
        ma.push(Date.now(), tweetCounter)
    })

    // get media/images array
    let media = tweet.entities.media

    if (media !== undefined && media.length > 0) {
        sendProcessImage(media, tweet)
    }
})


const resetTweetParams = () => {
    global.tweetCounter = 0
    client.untrack(trackerTerm)
}


const sendProcessImage =  async (media, tweet) => {

    media.forEach(async (image) => {

        const imageOptions = {
            url: image.media_url_https,
            dest: config.images_path
        }

        try {

            const { fileName } = await imageDownloader.image(imageOptions)

            const data = await faceDetection.detectFaces(fileName)

            io.emit('tweet', {
                "tweet": tweet,
                "fileUrl": data.fileUrl,
                "fileName": data.fileName,
                "trackerTerm": trackerTerm,
                "tweetCounter": global.tweetCounter
            })

        } catch (error) {
            console.log(error)
        }
    })
}


// RUN PROGRAM AND LOG ERRORS

client.track(trackerTerm)

client.on('error', (err) => {
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

