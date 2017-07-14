var express = require('express');

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