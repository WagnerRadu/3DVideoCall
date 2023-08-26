// import './node_modules/jimp/browser/lib/jimp.js';
import "../../node_modules/jimp/browser/lib/jimp.js";

import * as tf from '@tensorflow/tfjs';
// import * as tf from './custom_tfjs/custom_tfjs.js';

async function processFace(imageData) {

    tf.setBackend("cpu")

    // Load original image from which to generate face texture.
    // let image = await Jimp.read('./assets/test_img_1.jpg')

    imageData = imageData.split(',')[1]; 
    let image = await Jimp.read(Buffer.from(imageData, "base64"));


    // Process the image into a 96 x 96, 3 channel greyscale input tensor for the model
    image.resize(96, 96);
    image.grayscale();
    const outShape = [1, image.bitmap.width, image.bitmap.height, 4];
    let input = tf.tensor4d(image.bitmap.data, outShape, 'float32');
    input = input.slice([0, 0, 0, 0], [1, image.bitmap.width, image.bitmap.height, 3]);

    // image.getBase64(Jimp.AUTO, function(err, data) {
    //     document.getElementById("image").setAttribute("src", data);
    //   });

    // Get predicted facial landmark positions
    const model = await tf.loadLayersModel('model_dir/model.json');
    let output = model.predict(input).dataSync();

    // let output = [62.3718376159668, 41.93854904174805, 32.98002624511719, 41.13397216796875, 49.15152359008789, 62.13052749633789, 48.9090461730957, 73.91754150390625];

    let right_eye_x = output[0] * 1000 / 96;
    let right_eye_y = output[1] * 1000 / 96;
    let left_eye_x = output[2] * 1000 / 96;
    let left_eye_y = output[3] * 1000 / 96;
    let nose_x = output[4] * 1000 / 96;
    let nose_y = output[5] * 1000 / 96;
    let mouth_x = output[6] * 1000 / 96;
    let mouth_y = output[7] * 1000 / 96;
    let eyelevel = (left_eye_y + right_eye_y) / 2;

    // Re-read the face image to generate the final texture
    // let image = await Jimp.read('./assets/test_img_1.jpg');
    image = await Jimp.read(Buffer.from(imageData, "base64"));
    image.resize(1000, 1000);
    image = cv.matFromImageData(image.bitmap);

    // Scale and translate transformation matrix to normalize 
    //     facial landmark positions in the final texture
    let M = cv.matFromArray(2, 3, cv.CV_64FC1, [300 / (right_eye_x - left_eye_x), 0, 350 - left_eye_x * 300 / (right_eye_x - left_eye_x),
        0, 350 / (mouth_y - eyelevel), 300 - eyelevel * 350 / (mouth_y - eyelevel)]);

    // Applying the transformation to the face image
    cv.warpAffine(
        image,
        image,
        M,
        new cv.Size(1000, 1000),
        cv.INTER_LINEAR,
        cv.BORDER_REPLICATE,
        new cv.Scalar()
    );

    // cv.imshow('canvasOutput', image);

    image = new Jimp({
        width: image.cols,
        height: image.rows,
        data: Buffer.from(image.data)
    });

    image.getBase64(Jimp.AUTO, function (err, data) {
        console.log(data);
    });

    
    model.dispose();
    
    return image.getBase64Async(Jimp.AUTO);
}

export { processFace };