const express=require('express');
const path=require('path');

const route=express.Router();

const {check}=require('express-validator');

const adminController=require('../controllers/admin');

const isAuth=require('../middleware/is-auth');


route.get('/admin/add-product',isAuth,adminController.getAddProduct);

route.get('/admin/admin-products',isAuth,adminController.getProducts);

route.post('/admin/add-product',[
    check('title')
    .isString()
    .isLength({min:3}),
    check('price')
    .isFloat(),
    check('description')
    .isLength({min:5,max:400})
],
isAuth,adminController.postAddProduct);

route.get('/admin/edit-product/:productId',isAuth,adminController.getEditProduct);

route.post('/admin/edit-product',
[
    check('title')
    .isString()
    .isLength({min:3}),
    check('price')
    .isFloat(),
    check('description')
    .isLength({min:5,max:400})
], 
isAuth,adminController.postEditProduct);

route.delete('/admin/admin-products/:productId',isAuth,adminController.deleteProduct);

module.exports=route;
 