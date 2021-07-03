const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const nodemailer=require('nodemailer');
const sendgridTransport=require('nodemailer-sendgrid-transport');
const {validationResult}=require('express-validator/check')

const User=require('../models/user');

const transporter=nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key:'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'
  }
}));

exports.getLogin=(req,res,next)=>{
    let message=req.flash('error');
    if(message.length>0){
      message=message[0];
    }
    else {
      message=null;
    }
    res.render('auth/login',
    {
        pageTitle:'Login', 
        path:'/login',
        errorMessage:message,
        oldInput:{
          email:'',
          password:''
        },
        validationErrors:[]
});
  };

  exports.postLogin=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldInput:{
          email:email,
          password:password
        },
        validationErrors:errors.array()
    });
  }

    User.findOne({email:email})
    .then(user=>{
      if(!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput:{
            email:email,
            password:password
          },
          validationErrors:[]
      });
        
      }
      bcrypt.compare(password,user.password)
      .then(doMatch=>{
          if(doMatch){
            req.session.isLoggedIn=true;
            req.session.user=user;
            return req.session.save((err)=>{  //to redirect after the session has been saved
            console.log(err);
            return res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or Password!',
            oldInput:{
              email:email,
              password:password
            },
            validationErrors:errors.array()
        });
      })
      .catch(err=>{
       // console.log(err);
        res.redirect('/login');
      })
    })
  };  

  exports.postLogout=(req,res,next)=>{
    req.session.destroy((err)=>{
    //  console.log(err);
      res.redirect('/');
    });
  }; 

  exports.getSignup = (req, res, next) => {
    let message=req.flash('error');
    if(message.length>0){
      message=message[0];
    }
    else {
      message=null;
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:message,
      oldInput:{email:"",password:"",confirmPassword:""},
      validationErrors:[]
    });
  };
  exports.postSignup = (req, res, next) => {
    const email=req.body.email;
    const password=req.body.password;
    const confirmPassword=req.body.confirmPassword;
    const error=validationResult(req);
    if(!error.isEmpty()){
      console.log(error);
      return res.status(422).render('auth/signup', {
          path: '/signup',
          pageTitle: 'Signup',
          errorMessage:error.array()[0].msg,
          oldInput:{email:email,password:password,confirmPassword:confirmPassword},
          validationErrors:error.array()
        });
    }
         bcrypt
        .hash(password,12)
        .then(hashedPassword=>{
          const user=new User({
            email:email,
            password:hashedPassword,
            cart:{items:[]}
          });
            return user.save();
        })
        .then(result=>{
          res.redirect('/login');
          return transporter.sendMail({
              to:email,
              from:'2018021022@mmmut.ac.in',
              subject:'Successful Signup',
              html:'<h1>Congrats!! Your Signup was successful.</h1>'
          });
        })
        .catch((err)=>{
          const error=new Error(err);
          error.httpStatusCode=500;
          return next(error);
        });
  };  

  exports.getReset=(req,res,next)=>{
    let message=req.flash('error');
    if(message.length>0){
      message=message[0];
    }
    else {
      message=null;
    }
    res.render('auth/reset',
    {
      pageTitle:'Reset Password',
      path:'/reset',
      errorMessage:message
    })
  };

  exports.postReset=(req,res,next)=>{
    crypto.randomBytes(32,(err,buffer)=>{
      if(err){
        //console.log(err);
        res.redirect('/reset');
      }
      const token=buffer.toString('hex');
      User.findOne({email:req.body.email})
      .then(user=>{
        if(!user){
          req.flash('error','No such user found!');
          return res.redirect('/reset');
        }
        user.resetToken=token;
        user.resetTokenExpiration=Date.now()+3600000;
        return user.save();
      })
      .then(result=>{
        res.redirect('/');
        transporter.sendMail({
          to:req.body.email,
          from:'2018021022@mmmut.ac.in',
          subject:'Passsword Reset',
          html:`
            <p>You requested for password reset.</p>
            <p>Click the <a href='http://localhost:3000/reset/${token}'>link</a> for resetting the password</p>
          `
      });
    })
    .catch(err=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    })
    })
  };

  exports.getNewPassword=(req,res,next)=>{

      const token=req.params.token;
      User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
      .then(user=>{
        console.log(user);
        let message=req.flash('error');
    if(message.length>0){
      message=message[0];
    }
    else {
      message=null;
    }
    res.render('auth/new-password',
    {
      pageTitle:'New Password',
      path:'/new-password',
      errorMessage:message,
      passwordToken:token,
      userId:user._id.toString()
    })

    })
    .catch(err=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    })
  };

  exports.postNewPassword=(req,res,next)=>{
    const newPassword=req.body.password;
    const userId=req.body.userId;
    const passwordToken=req.body.passwordToken;
    let resetUser;
    User.findOne({resetToken:passwordToken,resetTokenExpiration:{$gt:Date.now()},_id:userId})
    .then(user=>{
      resetUser=user;
      return bcrypt.hash(newPassword,12)
    })
    .then(hashedPassword=>{
      resetUser.password=hashedPassword;
      resetUser.resetToken=undefined;
      resetUser.resetTokenExpiration=undefined;
      resetUser.save();
    })
    .then(result=>{
      res.redirect('/login');
    })
    .catch(err=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    })
  }