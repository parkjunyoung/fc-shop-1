var express = require('express');

//MongoDB 접속
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log('mongodb connect');
});

var connect = mongoose.connect('mongodb://127.0.0.1:27017/fastcampus', { useMongoClient: true });
autoIncrement.initialize(connect);

var admin = require('./routes/admin');

var app = express();
var port = 3000;


app.get('/', function(req,res){
    res.send('first app');
});
// Routing
app.use('/admin', admin);

app.listen( port, function(){
    console.log('Express listening on port', port);
});