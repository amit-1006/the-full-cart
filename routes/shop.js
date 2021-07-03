const express=require('express');
const path=require('path');

const route=express.Router();
const adminData=require('./admin.js');

const shopController=require('../controllers/shop');

const isAuth=require('../middleware/is-auth');

route.get('/',shopController.getIndex);

route.get('/products',shopController.getProducts);

 route.get('/products/:productId',shopController.getProduct);

route.get('/cart',isAuth,shopController.getCart);

route.post('/cart',isAuth,shopController.postCart);

route.get('/orders',isAuth,shopController.getOrder);

//route.post('/create-order',isAuth,shopController.postOrder);

route.post('/cart-delete-item',isAuth,shopController.postCartDeleteProduct);

route.get('/checkout',isAuth,shopController.getCheckout);

route.get('/checkout/success',shopController.getCheckoutSuccess);

route.get('/checkout/cancel',shopController.getCheckout);

route.get('/orders/:orderId',isAuth,shopController.getInvoice);

module.exports=route;