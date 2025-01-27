const 
    express         = require('express'),
    verifyJWT       = require('./middleware/verifyJWT'),
    mongoose        = require('mongoose'),
    cookieParser    = require('cookie-parser'),
    cors            = require('cors'),
    connectDB       = require('./config/dbConn'),
    corsOptions     = require('./config/corsOptions'),
    fileUpload = require('express-fileupload'),
    bodyParser = require('body-parser');


require('dotenv').config();

const PORT = process.env.PORT || 2025;



const app = express();


// Use the CORS middleware with the defined options
app.use(cors(corsOptions));
// Connect to MongoDB
connectDB();

// MIDDLEWARE
app.use(express.json({limit: '10mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
//middleware for cookies
app.use(cookieParser());

// routes AUTH + JWT
app.use('/auth',        require('./routes/auth'));
app.use('/refresh',     require('./routes/refresh'));
app.use('/logout',      require('./routes/logout'));

// study handling

// app.use(verifyJWT);
// app.use('/study',      require('./routes/study'));
app.use('/report',      require('./routes/report'));
app.use('/pacs',      require('./routes/pacs'));


mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});