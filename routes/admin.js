var express = require('express');
var router = express.Router();
var ProductsModel = require('../models/ProductsModel');
var CommentsModel = require('../models/CommentsModel');
var CheckoutModel = require('../models/CheckoutModel');
var adminRequired = require('../libs/adminRequired');
var co = require('co');

// csrf 셋팅
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

//이미지 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../uploads' ); // 루트의 uploads위치에 저장한다.
var fs = require('fs');

//multer 셋팅
var multer  = require('multer');
var storage = multer.diskStorage({
    destination : function (req, file, callback) { //이미지가 저장되는 도착지 지정
        callback(null, uploadDir );
    },
    filename : function (req, file, callback) { // products-날짜.jpg(png) 저장 
        callback(null, 'products-' + Date.now() + '.'+ file.mimetype.split('/')[1] );
    }
});
var upload = multer({ storage: storage });


router.get('/', function(req,res){
    res.send('admin app');
});

router.get('/products', adminRequired, function(req,res){
    ProductsModel.find( function(err,products){ //첫번째 인자는 err, 두번째는 받을 변수명
        res.render( 'admin/products' , 
            { products : products } // DB에서 받은 products를 products변수명으로 내보냄
        );
    });
});

router.get('/products/write',adminRequired, csrfProtection , function(req,res){
    //edit에서도 같은 form을 사용하므로 빈 변수( product )를 넣어서 에러를 피해준다
    res.render( 'admin/form' , { product : "", csrfToken : req.csrfToken() }); 
});

router.post('/products/write', adminRequired , upload.single('thumbnail'), csrfProtection, function(req,res){
    var product = new ProductsModel({
        name : req.body.name,
        thumbnail : (req.file) ? req.file.filename : "",
        price : req.body.price,
        description : req.body.description,
        username : req.user.username
    });
    var validationError = product.validateSync();
    if(validationError){
        res.send(validationError);
    }else{
        product.save(function(err){
            res.redirect('/admin/products');
        });
    }
});

router.get('/products/detail/:id' , function(req, res){
    var getData = co(function* (){
        var product = yield ProductsModel.findOne( { 'id' :  req.params.id }).exec();
        var comments = yield CommentsModel.find( { 'product_id' :  req.params.id }).exec();
        return {
            product : product,
            comments : comments
        };
    });
    getData.then( function(result){
        res.render('admin/productsDetail', { product: result.product , comments : result.comments });
    });
});

router.get('/products/edit/:id' ,adminRequired, csrfProtection ,function(req, res){
    //기존에 폼에 value안에 값을 셋팅하기 위해 만든다.
    ProductsModel.findOne({ id : req.params.id } , function(err, product){
        res.render('admin/form', { product : product, csrfToken : req.csrfToken() });
    });
});

router.post('/products/edit/:id', adminRequired, upload.single('thumbnail'), csrfProtection, function(req, res){
    //그전에 지정되 있는 파일명을 받아온다
    ProductsModel.findOne( {id : req.params.id} , function(err, product){
        
        if(req.file){  //요청중에 파일이 존재 할시 이전이미지 지운다.
            fs.unlinkSync( uploadDir + '/' + product.thumbnail );
        }

        //넣을 변수 값을 셋팅한다
        var query = {
            name : req.body.name,
            thumbnail : (req.file) ? req.file.filename : product.thumbnail,
            price : req.body.price,
            description : req.body.description,
        };

        //update의 첫번째 인자는 조건, 두번째 인자는 바뀔 값들
        ProductsModel.update({ id : req.params.id }, { $set : query }, function(err){
            res.redirect('/admin/products/detail/' + req.params.id ); //수정후 본래보던 상세페이지로 이동
        });
    });
});

router.get('/products/delete/:id', function(req, res){
    ProductsModel.remove({ id : req.params.id }, function(err){
        res.redirect('/admin/products');
    });
});

router.post('/products/ajax_comment/insert', function(req,res){
    var comment = new CommentsModel({
        content : req.body.content,
        product_id : parseInt(req.body.product_id)
    });
    comment.save(function(err, comment){
        res.json({
            id : comment.id,
            content : comment.content,
            message : "success"
        });
    });

});

router.post('/products/ajax_comment/delete', function(req, res){
    CommentsModel.remove({ id : req.body.comment_id } , function(err){
        res.json({ message : "success" });
    });
});

router.post('/products/ajax_summernote', adminRequired, upload.single('thumbnail'), function(req,res){
    res.send( '/uploads/' + req.file.filename);
});

router.get('/order', adminRequired, function(req,res){
    CheckoutModel.find( function(err, orderList){ //첫번째 인자는 err, 두번째는 받을 변수명
        res.render( 'admin/orderList' , 
            { orderList : orderList }
        );
    });
});

router.get('/order/edit/:id', adminRequired, function(req,res){
    CheckoutModel.findOne( { id : req.params.id } , function(err, order){
        res.render( 'admin/orderForm' , 
            { order : order }
        );
    });
});

module.exports = router;