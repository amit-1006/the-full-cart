const fs=require('fs');
const path=require('path');
const PDFDocument=require('pdfkit');
const stripe=require('stripe')(process.env.STRIPE_KEY);

const Product=require('../models/product.js');
const Order=require('../models/order.js');

const ITEMS_PER_PAGE=2;


  exports.getProducts=(req,res,next)=>{
    const page=+req.query.page || 1;
  let totalItems;

  Product.find().countDocuments()
  .then(numProducts=>{
    totalItems=numProducts;
    return  Product.find()
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products=>{
    res.render('shop/product-list',
    {prods:products,
    pageTitle:'Products',
    path:'/products',
    currentPage:page,
    hasNextPage:totalItems> page*ITEMS_PER_PAGE,
    hasPreviousPage:page>1,
    nextPage:page+1,
    previousPage:page-1,
    lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
  });
  })
   .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
   })
 };

 exports.getProduct=(req,res,next)=>{
   const proId=req.params.productId;
   Product.findById(proId)
   .then(product=>{
    res.render('shop/product-detail',
    {product:product,
    pageTitle:product.title,
    path:"/products",
      })
   })
   .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
 }

 exports.getIndex=(req,res,next)=>{
  const page=+req.query.page || 1;
  let totalItems;

  Product.find().countDocuments()
  .then(numProducts=>{
    totalItems=numProducts;
    return  Product.find()
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products=>{
    res.render('shop/index',
    {prods:products,
    pageTitle:'Shop',
    path:'/shop',
    currentPage:page,
    hasNextPage:totalItems> page*ITEMS_PER_PAGE,
    hasPreviousPage:page>1,
    nextPage:page+1,
    previousPage:page-1,
    lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
  });
  })
  .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
 }

 exports.getCart=(req,res,next)=>{
   req.user
   .populate('cart.items.productId')
   .execPopulate()    //to get a promise
   .then(user=>{
    // console.log(user.cart.items);
     const products=user.cart.items;
    res.render('shop/cart',
    {pageTitle:'Your Cart',
    path:'/cart',
    products:products,
  });
   })
   .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
 }

 exports.postCart=(req,res,next)=>{
   const proId=req.body.productId;

  Product.findById(proId)
  .then(product=>{
    return req.user.addToCart(product);
  })
  .then(result=> res.redirect('/cart'));
 }

 exports.getOrder=(req,res,next)=>{

    Order.find({'user.userId':req.user._id})
    .then(orders=>{
      res.render('shop/orders',{
      path:'/orders',
      pageTitle:'Your Orders',
      orders:orders,
      }
      );
    })
    .catch(err=>{
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    })
 }

 exports.getCheckout=(req,res,next)=>{
  let products;
  let total=0
  req.user
  .populate('cart.items.productId')
  .execPopulate()  
  .then(user=>{
    products=user.cart.items;
    total=0;
   products.forEach(p=>{
     total+=p.quantity*(+p.productId.price);
   })

   return stripe.checkout.sessions.create({
    payment_method_types:['card'],
    line_items:products.map(p=>{
      return {
        name:p.productId.title,
        description:p.productId.description,
        amount:(+p.productId.price)*100,
        currency:'inr',
        quantity:p.quantity
      };
    }),
    success_url:req.protocol+'://'+req.get('host')+'/checkout/success',
    cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel'
   });
  })
  .then(session=>{
   res.render('shop/checkout',
   {pageTitle:'Checkout',
   path:'/checkout',
   products:products,
   totalSum:total,
   sessionId:session.id
 });
  })
  .catch(err=>{
    //console.log(err);
   const error=new Error(err);
   error.httpStatusCode=500;
   return next(error);
 });
 
 }

 exports.getCheckoutSuccess=(req,res,next)=>{   // same as postOrder
  req.user
  .populate('cart.items.productId')
  .execPopulate()    //to get a promise
  .then(user=>{
   // console.log(user.cart.items);
    const products=user.cart.items.map(i=>{
      return {quantity:i.quantity,productData:{...i.productId._doc}} // to get whole product from productId
    });
    const order=new Order({
      user:{
        email:req.user.email,
        userId:req.user._id
      },
      products:products
    });
     return order.save();
  })
  .then(result=>{
    req.user.clearCart();
  })
  .then(result=>{
    res.redirect('/orders');
   })
   .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
  
}

 exports.postOrder=(req,res,next)=>{
  req.user
  .populate('cart.items.productId')
  .execPopulate()    //to get a promise
  .then(user=>{
   // console.log(user.cart.items);
    const products=user.cart.items.map(i=>{
      return {quantity:i.quantity,productData:{...i.productId._doc}} // to get whole product from productId
    });
    const order=new Order({
      user:{
        email:req.user.email,
        userId:req.user._id
      },
      products:products
    });
     return order.save();
  })
  .then(result=>{
    req.user.clearCart();
  })
  .then(result=>{
    res.redirect('/orders');
   })
   .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
  
}

 exports.postCartDeleteProduct=(req,res,next)=>{
  const prodId=req.body.productId;
  req.user.removeFromCart(prodId)
  .then(result=> res.redirect('/cart'))
  .catch(err=>{
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  })
}

exports.getInvoice=(req,res,next)=>{
    const orderId=req.params.orderId;

    Order.findById(orderId)
    .then(order=>{
      if(!order){
        return next(new Error("No Order found"));
      }
      if(order.user.userId.toString()!==req.user._id.toString()){
        return next(new Error("Unauthorized User"));
      }
      const invoiceName='invoice-' + orderId + '.pdf';
      const invoicePath=path.join('data','invoices',invoiceName);

      const pdfDoc=new PDFDocument();
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice",{
        underline:true
      });
      pdfDoc.text('------------');

      let totalSum=0;

      order.products.forEach(prod=>{
        totalSum+=prod.quantity*prod.productData.price;
        pdfDoc.fontSize(15).text(prod.productData.title + ' - ' + prod.quantity + ' X ' + ' Rs ' + prod.productData.price);
      })

      pdfDoc.text('---------------');

      pdfDoc.fontSize(20).text('Total Amount = Rs ' + totalSum);

      pdfDoc.end();

    //   fs.readFile(invoicePath,(err,data)=>{
    //   if(err){
    //     return next(err);
    //   }
    //   else{
    //     res.setHeader('Content-Type','application/pdf');
    //     res.setHeader('Content-Disposition','attachment; filename="'+invoiceName+'"');
    //     res.send(data);
    //   }

    // });
        // const file=fs.createReadStream(invoicePath);
        // res.setHeader('Content-Type','application/pdf');
        // res.setHeader('Content-Disposition','attachment; filename="'+invoiceName+'"');

        // file.pipe(res);
      
    })
    .catch(err=>next(err))
}



