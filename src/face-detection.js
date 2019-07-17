const cv = require('opencv4nodejs')
const shortid = require('shortid')
const { extname, join } = require('path')
const { unlinkSync } = require('fs')

const detectFaces = (imageName) => {

    return new Promise((resolve, reject) => {


        try {

            const image = cv.imread(imageName)
            const extension = fileExtension(imageName)
            const extension = extname(imageName)
            // HAAR trained face detection classifier
            const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2)
            // detect faces
            const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray())

            if (!objects.length) {

                unlinkSync(imageName)

                reject('no faces found')
            }

            // draw detection
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

            const generatedFileName = shortid.generate()
            const fileName = join(__dirname, "public", "processed_images", `${generatedFileName}.${extension}`)

            cv.imwrite(fileName, image)

            unlinkSync(imageName)

            resolve({
                "facesFound": objects.length,
                "fileUrl": join("processed_images", `${generatedFileName}.${extension}`),
                "fileName": generatedFileName
            })


        } catch (err) {
            reject(err)
        }

    })
}

module.exports = {
    detectFaces
}