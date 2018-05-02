const dotenv = require('dotenv');
dotenv.load();

const config = {
    cloud_name: "dcvgthnjw",
    api_key: "217168113513277",
    api_secret: "FMkukiX8dthFKVpukqFi6ZBpXUw"
}

const cloudinary = require('cloudinary');
cloudinary.config(config);

exports.uploadToCloudinary = function(file) {
    return new Promise(function(resolve, reject) {
        cloudinary.v2.uploader.upload(file.path, (err, result) => {
            if(err) return reject(err)
            return resolve(result);
        });
    });
}