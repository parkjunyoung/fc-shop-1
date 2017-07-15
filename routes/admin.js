var express = require('express');
var router = express.Router();

router.get('/', function(req,res){
    res.send('admin app');
});

router.get('/products', function(req,res){
    res.render( 'admin/products' , 
        { message : "hello" } // message 란 변수를 템플릿으로 내보낸다.
    );
});

module.exports = router;