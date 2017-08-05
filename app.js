var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

//flash  메시지 관련
var flash = require('connect-flash');
 
//passport 로그인 관련
var passport = require('passport');
var session = require('express-session');

//MongoDB 접속
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var autoIncrement = require('mongoose-auto-increment');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log('mongodb connect');
});

var connect = mongoose.connect('mongodb://127.0.0.1:27017/fastcampus', { useMongoClient: true });
autoIncrement.initialize(connect);

var admin = require('./routes/admin');
var accounts = require('./routes/accounts');
var auth = require('./routes/auth');
var home = require('./routes/home.js');
var chat = require('./routes/chat');
var products = require('./routes/products');
var cart = require('./routes/cart');
var checkout = require('./routes/checkout');

var app = express();
var port = 3000;

// 확장자가 ejs 로 끈나는 뷰 엔진을 추가한다.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 미들웨어 셋팅
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//업로드 path 추가
app.use('/uploads', express.static('uploads'));

//static path 추가
app.use('/static', express.static('static'));


//session 관련 셋팅
var connectMongo = require('connect-mongo');
var MongoStore = connectMongo(session);

var sessionMiddleWare = session({
    secret: 'fastcampus',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 2000 * 60 * 60 //지속시간 2시간
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 14 * 24 * 60 * 60
    })
});
app.use(sessionMiddleWare);

//passport 적용
app.use(passport.initialize());
app.use(passport.session());

//플래시 메시지 관련
app.use(flash());

//로그인 정보 뷰에서만 변수로 셋팅, 전체 미들웨어는 router위에 두어야 에러가 안난다
app.use(function(req, res, next) {
  app.locals.isLogin = req.isAuthenticated();
  //app.locals.urlparameter = req.url; //현재 url 정보를 보내고 싶으면 이와같이 셋팅
  //app.locals.userData = req.user; //사용 정보를 보내고 싶으면 이와같이 셋팅
  next();
});

// Routing
app.use('/admin', admin);
app.use('/accounts', accounts);
app.use('/auth', auth);
app.use('/chat', chat);
app.use('/products', products);
app.use('/cart', cart);
app.use('/checkout', checkout);
app.use('/', home);

var server = app.listen( port, function(){
    console.log('Express listening on port', port);
});

var listen = require('socket.io');
var io = listen(server);
//socket io passport 접근하기 위한 미들웨어 적용
io.use(function(socket, next){
  sessionMiddleWare(socket.request, socket.request.res, next);
});
require('./libs/socketConnection')(io);