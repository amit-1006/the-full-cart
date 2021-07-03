const Product=require('../models/product.js');
const {validationResult}=require('express-validator');
const fileHelper=require('../util/file');

 exports.getAddProduct=(req,res,next)=>{
   if(!req.session.isLoggedIn){
     return res.redirect('/login'); 
   }
    res.render('admin/edit-product',
    {pageTitle:"Add Product" ,
    path:"/add-product",
    editing:false,
    hasError:false,
    errorMessage:null,
    validationErrors:[]
  });
 };

 exports.postAddProduct=(req,res,next)=>{
     const title=req.body.title;
     const image=req.file;
     const price=req.body.price;
     const description=req.body.description;
     const errors=validationResult(req);
     console.log(image);

     if(!image){
       return res.status(422).render('admin/edit-product',{pageTitle:"Add Product" ,
       path:"/add-product",
       editing:false,
       hasError:true,
       product:{
         title:title,
         price:price,
         description:description
       },
       errorMessage:"Attached File is not an image!",
       validationErrors:[]
     })
     }

     if(!errors.isEmpty()){
       console.log(errors.array());
      return res.status(422).render('admin/edit-product',{pageTitle:"Add Product" ,
      path:"/add-product",
      editing:false,
      hasError:true,
      product:{
        title:title,
        price:price,
        description:description
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    })
     }

     const imageUrl=image.path;

     const product= new Product({
       title:title,
      imageUrl:imageUrl,
      price:price,
      description:description,
      userId:req.user._id
    });
     product
    .save()
    .then(result=>{
      // console.log("Product created");
      res.redirect("/admin/admin-products");
    })
    .catch(err=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    })
  };

  exports.getEditProduct=(req,res,next)=>{
    const editMode=req.query.edit;
    if(!editMode){
      return res.redirect('/');
    }
    const prodId=req.params.productId;
    Product.findById(prodId)
    .then(product=>{
      if(!product){
        return res.redirect('/');
      }
      res.render('admin/edit-product',{pageTitle:"Add Product" ,
      path:"/edit-product",
      editing:editMode,
      product:product,
      hasError:false,
      errorMessage:null,
      validationErrors:[]
    });
  })
    .catch((err)=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
    
 };

 exports.postEditProduct=(req,res,next)=>{
    const prodId=req.body.productId;
    const updatedTitle=req.body.title;
    const image=req.file;
    const updatedPrice=req.body.price;
    const updatedDescription=req.body.description;

    const errors=validationResult(req);
     if(!errors.isEmpty()){
      return res.status(422).render('admin/edit-product',{pageTitle:"Edit Product" ,
      path:"/edit-product",
      editing:true,
      hasError:true,
      product:{
        title:updatedTitle,
        price:updatedPrice,
        description:updatedDescription,
        _id:prodId
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    })
     }

    Product.findById(prodId).then(product=>{
      if(product.userId.toString()!==req.user._id.toString()){
        return res.redirect('/');
      }
      product.title=updatedTitle;
      if(image){
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl=image.path;
      }
      product.price=updatedPrice;
      product.description=updatedDescription;
      return product.save()
      .then(result=>{
       // console.log("Product Updated!!");
        res.redirect('/admin/admin-products');
      })
    })
    .catch((err)=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
 }

  exports.getProducts=(req,res,next)=>{
    Product.find({userId:req.user._id})
    .then(products=>{
      res.render('admin/products',
      {prods:products,
      pageTitle:'Admin Products',
      path:'/admin-products',
    });
    })
    .catch((err)=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
  }

  exports.deleteProduct=(req,res,next)=>{
    const prodId=req.params.productId;
    Product.findById(prodId)
    .then(product=>{
      if(!product){
        return next(new Error("Product Not Found!"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return  Product.deleteOne({_id:prodId,userId:req.user._id})
    })
    .then(result=>{
      res.status(200).json({message:"Success"});
    })
    .catch((err)=>{
      res.status(500).json({message:"Deletion Failed"});
    });
    
  }

