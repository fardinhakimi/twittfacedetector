const cv = require('opencv4nodejs')
const shortid = require('shortid')
const { extname, join} = require('path')
const { unlinkSync } = require('fs')
const config = require('./config.js')

const detectFaces = (imageName) => {

    return new Promise(async (resolve, reject) => {

        try {

            const image = cv.imread(imageName)
            const extension = extname(imageName)
            // HAAR trained face detection classifier
            const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2)
            // detect faces
            const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray())
            
            if ( objects === []) {

                unlinkSync(imageName)

                reject('no faces found')
            }

            // Draw detection
            const numDetectionsTh = 10

            objects.forEach((rect, i) => {
                const color = new cv.Vec(255, 0, 0)
                let thickness = 2
                if (numDetections[i] < numDetectionsTh) {
                    thickness = 1
                }

                image.drawRectangle(
                    new cv.Point(rect.x, rect.y),
                    new cv.Point(rect.x + rect.width, rect.y + rect.height),
                    color, { thickness }
                )
            })

            generatedFileName = await saveProcessedImage(image, extension);
        
            resolve({
                "facesFound": objects.length,
                "processedFileUrl": join('processed_images', `${generatedFileName}.${extension}`),
                "generatedFileName": generatedFileName
            })

        } catch (err) {
            reject(err)
        }

    })
}


const saveProcessedImage = (processedImage, extension) => {

    return new Promise((resolve, reject) => {

        try {

            const generatedFileName = shortid.generate()

            cv.imwrite(join(config.processed_images_path, `${generatedFileName}.${extension}`), processedImage)

            resolve(generatedFileName)

        }catch(err){
            reject(err)
        }
    })
}

module.exports = {
    detectFaces
}