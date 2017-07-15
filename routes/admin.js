var express = require('express');
var router = express.Router();
var ProductsModel = require('../models/ProductsModel');

router.get('/', function(req,res){
    res.send('admin app');
});

router.get('/products', function(req,res){
    ProductsModel.find( function(err,products){ //첫번째 인자는 err, 두번째는 받을 변수명
        res.render( 'admin/products' , 
            { products : products } // DB에서 받은 products를 products변수명으로 내보냄
        );
    });
});

router.get('/products/write', function(req,res){
    res.render( 'admin/form');
});

router.post('/products/write', function(req,res){
    var product = new ProductsModel({
        name : req.body.name,
        price : req.body.price,
        description : req.body.description,
    });
    product.save(function(err){
        res.redirect('/admin/products');
    });
});

module.exports = router;