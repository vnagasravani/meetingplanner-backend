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

/* In case you want to validate your file type */
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
//         cb(null, true);
//     } else {
//         cb(new Error('Wrong file type, only upload JPEG and/or PNG !'),
//             false);
//     }
// };

const upload = multer({

    storage: multerS3({
        acl: 'public-read',
        s3,
        bucket: 'hemanth1508',
        key: function (req, file, cb) {
            /*I'm using Date.now() to make sure my file has a unique name*/
            req.file = file.originalname;
            cb(null, file.originalname);
        }
    })
});
//fileFilter: fileFilter,
module.exports = upload;