const mongoose = require('mongoose')
const config = require('./config')

module.exports = function () {
  var db = mongoose.connect(config.mongodb,{useNewUrlParser:true, useUnifiedTopology: true},function (err) {
      if (err) {
          console.log("Connection Error:" +err);
      } else {
          console.log("Connection success!");
      }
  }); // 连接数据库
  return db;
};