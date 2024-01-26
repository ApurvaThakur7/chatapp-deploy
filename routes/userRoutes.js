const express = require('express');
const user_route = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path'); 
const userController = require('../controllers/userController.js');
const auth = require('../middlewares/auth.js');
const session =require ('express-session');
const {SESSION_SECRET}= process.env;
console.log('SESSION_SECRET:', SESSION_SECRET);

//configurations
user_route.use(session({
    secret:SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.set('view engine', 'ejs'); 
user_route.set('views', './views'); 

user_route.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images')); // Uploads will be stored in the images directory
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    },
});

const upload = multer({ storage: storage });


user_route.get('/groupchat/:groupName',userController.groupChatPage);

user_route.get('/register',auth.isLogout, userController.registerLoad);
user_route.post('/register', upload.single('image'), userController.register);

user_route.get('/login',auth.isLogout, userController.loadLogin);
user_route.post('/login',userController.login);
user_route.get('/logout',auth.isLogin, userController.logout);

user_route.get('/dashboard',auth.isLogin, userController.loadDashboard);

user_route.post('/save-chat',userController.saveChat);

user_route.get('/groups',auth.isLogin, userController.loadGroups);
user_route.post('/groups', upload.none(), userController.createGroup);

user_route.get('*', function(req,res){
    res.redirect('/login')
});

module.exports = user_route;
