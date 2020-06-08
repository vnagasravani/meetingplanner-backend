const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
dotenv.config();

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: 'ap-south-1' //E.g us-east-1
});

const s3 = new aws.S3();

const myBucket = 'hemanth1508'
let myKey = '.jpg'
const signedUrlExpireSeconds = 60 * 15

let url = s3.getSignedUrl('getObject', {
    Bucket: myBucket,
    Key: myKey,
    Expires: signedUrlExpireSeconds
})
// uploadProfile(req) {
//     this.myKey = req.userId + myKey;
//     s3.putObject({
//         Bucket: myBucket,
//         Body: req.image,
//         Key: myKey
//     })
// }

// const upload = multer({

//     storage: multerS3({
//         s3,
//         bucket: 'hemanth1508',
//         key: function (req, file, cb) {
//             /*I'm using Date.now() to make sure my file has a unique name*/
//             req.image = 'profiles/' + req.userId + '.jpg';
//             cb(null, 'profiles/' + req.userId + '.jpg');
//         }
//     })
// });


module.exports = {
    url: url,
    //upload: uploadProfile
}