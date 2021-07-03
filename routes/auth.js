const express = require('express');

const authController = require('../controllers/auth');
const User=require('../models/user');
const {check}=require('express-validator');

const route = express.Router();

route.get('/login', authController.getLogin);

route.get('/signup', authController.getSignup);

route.post('/login', 
[
    check('email')
    .isEmail()
    .withMessage('Please enter valid emial!')
    .normalizeEmail(),
    check('password')
    .isLength({min:6})
    .withMessage("Password should be of length atleast 6 characters!")
    .trim()
],
authController.postLogin);

route.post('/signup',
[
    check('email')
    .isEmail()
    .withMessage("Please enter a valid email!")
    .normalizeEmail()
    .custom((value,{req})=>{
        return User.findOne({email:value})
        .then(result=>{
        if(result){
         return Promise.reject('Email already exists!');
        }
    })
    }),
    check('password')
    .isLength({min:6})
    .withMessage("Password should be of length atleast 6 characters!")
    .trim(),
    check('confirmPassword')
    .custom((value,{req})=>{
        if(value!==req.body.password){
            throw new Error("Passwords have to match!");
        }
        return true;
    })
    .trim()
],
    authController.postSignup);

route.post('/logout', authController.postLogout);

route.get('/reset',authController.getReset);

route.post('/reset',authController.postReset);

route.get('/reset/:token',authController.getNewPassword);

route.post('/new-password',authController.postNewPassword);


module.exports = route;