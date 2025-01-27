const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://h1pp0:sL8rROeEMiL0u3hh@maincluster.xvkgn6a.mongodb.net/hipporis');
    } catch (err) {
        console.error(err);
    }
}

module.exports = connectDB;