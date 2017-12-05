const cv = require('opencv4nodejs');
const fileExtension = require('file-extension');
const shortid = require('shortid');
const path = require('path');
const fs = require('fs');

function detectFaces(imageName, callback) {

    const image = cv.imread(imageName);
    const extension = fileExtension(imageName);
    // HAAR trained face detection classifier
    const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

    // detect faces
    const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray());


    if (!objects.length) {

        fs.unlink(imageName, function(err) {
            if (err) throw err;
            callback("no faces found", undefined);
        });

    } else {
        console.log(objects.length)

        // draw detection
        const numDetectionsTh = 10;
        objects.forEach((rect, i) => {
            const color = new cv.Vec(255, 0, 0);
            let thickness = 2;
            if (numDetections[i] < numDetectionsTh) {
                thickness = 1;
            }

            image.drawRectangle(
                new cv.Point(rect.x, rect.y),
                new cv.Point(rect.x + rect.width, rect.y + rect.height),
                color, { thickness }
            );
        });
        //cv.imshowWait('face detection', image);

        const generatedFileName = shortid.generate();
        // filename generated with path for saving
        const fileName = path.join(__dirname, "public", "processed_images", generatedFileName + "." + extension);

        cv.imwrite(fileName, image);
        fs.unlink(imageName, function(err) {
            if (err) throw err;
            callback(undefined, {
                "facesFound": objects.length,
                "fileUrl": path.join("processed_images", generatedFileName + "." + extension),
                "fileName": generatedFileName
            });
        });
    }
}

module.exports = {
    detectFaces
}