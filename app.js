var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser'); 
var expressJwt = require('express-jwt');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var uploadRouter = require('./routes/upload');
var jwt = require('./service/jwt')

const mongoose = require('./db/mongoose')
const db = mongoose()

var app = express();

// //设置跨域访问（设置在所有的请求前面即可）
// app.all("*", function (req, res, next) {
//   //设置允许跨域的域名，*代表允许任意域名跨域
//   res.header("Access-Control-Allow-Origin", "*");
//   //允许的header类型
//   res.header("Access-Control-Allow-Headers", "*");
//   //跨域允许的请求方式 
//   res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
//   if (req.method == 'OPTIONS')
//     res.sendStatus(200); //让options尝试请求快速结束
//   else
//       next();
// });

// 解析token获取信息
app.use(async function(req, res, next) {
  const token = req.headers['token']
  if(!token) {
    next();
  }
  else {
   const info = await jwt.verToken(token)
    req.info = info
   next()
  }
});

// 验证token
app.use(expressJwt({
  secret: jwt.signkey,
  getToken (req) {
    return req.headers.token  
  }
}).unless({
  path: ['/login/login']
}))

app.use(bodyParser.urlencoded({ entend:false }));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/upload', uploadRouter);

// error handler
app.use(function(err, req, res, next) {
  if(err.name === 'UnauthorizedError') return res.status(401).json({
    msg: 'token失效'
  })
});

module.exports = app;
