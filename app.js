const path = require('path');
const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const feedRouters = require('./routes/feed');
const mongoose = require('mongoose')
const app = express();
const authRoutes = require('./routes/auth');

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Data().toISOString() + "-" + file.originalname);
    }
})

const filterFile = (req, file, next) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg'){
        next();
    }
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed',  feedRouters);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
   console.log(error);
   const status = error.statusCode || 500;
   const message = error.message;
   const data = error.data;
   res.status(status).json({ message: message, data: data });
});

mongoose.connect('mongodb+srv://kdavidmongoose2001A:mongodbpassword@cluster0.xdmae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(result => {
    const server = app.listen(8000);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
        console.log('Client connected');
    });
})
.catch(err => console.log(err));
