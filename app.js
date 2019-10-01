// call all the required packages
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs')

// Connect to MongoDB
const { MongoClient, ObjectId } = require('mongodb')
const url = 'mongodb://localhost:27017'
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) return console.log(err)
  console.log('\x1b[32m%s\x1b[0m', 'Successful connection to mongodb 👌');
  db = client.db('DatabaseUploads')
})

// CREATE EXPRESS APP
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

// ROUTES
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// SET STORAGE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        let a = file.originalname.split('.')
        cb(null, `${file.fieldname}-${Date.now()}.${a[a.length-1]}`)
    }
})

const upload = multer({ storage: storage })

// Uploading single file
app.post('/uploadfile', upload.single('file'), (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    res.send(file)
})

// Uploading multiple files
app.post('/uploadmultiple', upload.array('files', 12), (req, res, next) => {
    const files = req.files
    if (!files) {
        const error = new Error('Please choose files')
        error.httpStatusCode = 400
        return next(error)
    }
    res.send(files);
})

// Uploading image
app.post('/uploadimage', upload.single('image'), (req, res) => {
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
        contentType: req.file.mimetype,
        image: new Buffer(encode_image, 'base64')
    };
    
    db.collection('images').insertOne(finalImg, (err, result) => {
        console.log(result)
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/')
    })
})

// Get all images
app.get('/images', (req, res) => {
    db.collection('images').find().toArray((err, result) => {
        const imgArray = result.map(element => element._id);
        console.log(imgArray);
        if (err) return console.log(err)
        res.send(imgArray)
    })
});

// Get image by id
app.get('/image/:id', (req, res) => {
    var id = req.params.id;
    db.collection('images').findOne({ '_id': ObjectId(id) }, (err, result) => {
        if (err) return console.log(err)
        console.log(result);
        res.contentType('image/jpeg');
        res.send(result.image.buffer)
    })
})

app.listen(3000, () => console.log('Server started on port 3000 '));