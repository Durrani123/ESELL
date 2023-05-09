const { express, app, bodyParser, ejs, session, pgSession, Pool, pool,upload } = require('./module.js');
const { getCartItems,getReviews,trendingItems,get4products,get4productsDetails,getProfileDetails,getProductsBoughtDetails,getProductsSoldDetails,getCategories } = require('./cartQuery.js');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(function (req, res, next) {
  if (req.session.user) {
    res.locals.checkLogin = true;
  } else {
    res.locals.checkLogin = false;
  }
  next();
});



// Get Requests

app.get("/",function(req,res){
  let productIds = [];
  trendingItems((error,resultArray)=>{
    if(error)
      console.log(error);
    else{
      // trending item <3  then
        if(resultArray.length<3){
          get4products((error,resultArray1)=>{
            if(error)
              console.log(error);
            else{
              productIds = resultArray1
              get4productsDetails(productIds,(error,resultArray2)=>{
                if(error)
                console.log(error);
                else{
                  let cart = [];
                  let username;
                  const { titles, descriptions, prices, locations, categoryNames, imageUrls,averageRating } = resultArray2;
                  
                  const maxCharacters = 500;
                  if(res.locals.checkLogin){
                    username  = req.session.user.userName;
                  }
                    getCartItems(username, (error, resultArray3) => {
                      if (error) {
                        console.log(error);
                      } 
                      else {
                          const cart = resultArray3.resultArray;
                          const totalPrice = resultArray3.totalPrice;
                          const length = titles.length;
                          getProfileDetails(username, (error, resultArray) => {
                            if (error) {
                              console.log(error);
                            }
                            else{
                              user=resultArray;
                            res.render("index1", { 
                            isLoggedIn: res.locals.checkLogin,
                            imageUrls: imageUrls,
                            titles: titles, 
                            descriptions:descriptions,
                            prices:prices,
                            locations:locations,
                            categoryNames:categoryNames,
                            productIds: productIds,
                            cart: cart.length ? cart : [],
                            totalPrice: cart.length ? totalPrice : 0,
                            averageRating:averageRating,
                            length:length,
                            user:user
                        });
                      }
                      });
                        }
                    });
                }
              })
            }
          })
        }
        // trending item > = 3 then
        else{
          productIds = resultArray;
          get4productsDetails(productIds,(error,resultArray2)=>{
            if(error)
            console.log(error);
            else{
              let cart = [];
              let username;
              const { titles, descriptions, prices, locations, categoryNames, imageUrls,averageRating } = resultArray2;
              if(res.locals.checkLogin){
                username  = req.session.user.userName;
              }
                getCartItems(username, (error, resultArray3) => {
                  if (error) {
                    console.log(error);
                  } 
                  else {
                      const cart = resultArray3.resultArray;
                      const totalPrice = resultArray3.totalPrice;
                      const length = titles.length;
                      getProfileDetails(username, (error, resultArray) => {
                        if (error) {
                          console.log(error);
                        }
                        else{
                        const user=resultArray;
                        console.log(user);
                        res.render("index1", { 
                        isLoggedIn: res.locals.checkLogin,
                        imageUrls: imageUrls,
                        titles: titles, 
                        descriptions:descriptions,
                        prices:prices,
                        locations:locations,
                        categoryNames:categoryNames,
                        productIds: productIds,
                        cart: cart.length ? cart : [],
                        totalPrice: cart.length ? totalPrice : 0,
                        averageRating:averageRating,
                        length:length,
                        user:user
                    });
                  }
                }); 
                  }
                });
            }
          })
        }
      }
  });
})
  app.get("/login", function (req, res) {
    res.render("login",{isLoggedIn:res.locals.checkLogin });
  });
  app.get("/signup", function (req, res) {
    res.render("signup",{isLoggedIn:res.locals.checkLogin });
  });
  app.get('/logout', function(req, res){
    req.session.destroy(function(err){
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
  });
  app.get("/sellPageInitial",function(req,res){
    if(!req.session.user){
      res.send('<script>alert("Signup First"); window.location.href = "/signup";</script>')
    }
    else{
    res.render("sellPageInitial",{isLoggedIn:res.locals.checkLogin });
    }
  });
  app.get('/sellPagePost',function (req, res) {
    const category = req.query.category;
    res.render('sellPagePost',{category:category,isLoggedIn:res.locals.checkLogin });
  });
  app.get('/productDescription',function (req, res){
    const productId = req.query.productId;
    pool.query('select title,description,totalitems,user_id,price,location,category_id from products where id = $1',[productId],function(error,result){
      if(error){
        console.log(error);
      }
      else{
        const title = result.rows[0].title;
        const description = result.rows[0].description;
        const price = result.rows[0].price;
        const totalitems = result.rows[0].totalitems;
        const location = result.rows[0].location;
        const category_id = result.rows[0].category_id;
        const user_id = result.rows[0].user_id; 
        let available ="No";
        if(totalitems>0){
          available ="Yes";
        }
        pool.query('select name from users where id = $1',[user_id],function(error,result){
          if(error){
            console.log(error);
          }
          else{
            const seller = result.rows[0].name;
         pool.query('select name from categories where id = $1',[category_id],function(error,result){
          if(error){
            console.log(error);
          }
          else{
            categoryName = result.rows[0].name;
            pool.query('select data,id from images where product_id = $1',[productId],function(error,result){
              if(error){
                console.log(error);
              }
              else{
                const product_id = result.rows.map(row => row.id);
                const dataUrl = [];
                for(let i=0;i<4;i++){
                const data = result.rows[i].data;
                const base64Data = data.toString('base64');
                const url = 'data:image/png;base64,' + base64Data;
                dataUrl.push(url);
                }
                getReviews(productId, (error, reviewArray) => {
                  if (error) {
                    console.log(error);
                  } 
                  else {
                    pool.query('SELECT AVG(rate) AS averageRating FROM rating WHERE product_id = $1', [productId],function(err, result){
                      if (err) {
                        console.log(err);
                      } else {
                        const averageRating = result.rows[0].averagerating;
                        res.render("productDescription", { 
                          isLoggedIn: res.locals.checkLogin,
                          dataUrl:dataUrl,
                          title:title, 
                          description:description,
                          price:price,
                          available:available,
                          location:location,
                          seller:seller,
                          categoryName:categoryName,
                          productId:productId,
                          review:reviewArray,
                          averageRating:averageRating
                        });
                      }
                    });
                      }
                });
                // res.render("productDescription", { 
                //   isLoggedIn: res.locals.checkLogin,
                //   dataUrl:dataUrl,
                //   title:title, 
                //   description:description,
                //   price:price,
                //   location:location,
                //   seller:seller,
                //   categoryName:categoryName,
                //   productId:productId
                // });
              }
            })
          }
        })
      }
      })
      }
  })
  })
  app.get('/order',function(req,res){
    const username = req.session.user.userName;
    pool.query('select product_id from cart where username = $1',[username],function(err,result){
      if(err){
        console.log(err)
      }
      else{
        const productId = result.rows.map(row => row.product_id);
        pool.query('DELETE FROM cart WHERE username = $1', [username], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            for (const id of productId) {
              pool.query('insert into orders (product_id, username) values ($1, $2)', [id, username], (err, result) => {
                if (err) {
                  console.log(err);
                } else {
                  pool.query('UPDATE products SET totalitems = totalitems - 1 WHERE id = $1', [productId[0]], (error, result) => {
                    if (error) {
                      console.log(error);
                    } else {
                      res.redirect('/');
                    }
                  });
                }
              });
            }
          }
        });
        
      }
    })
  })
  app.get('/rating',function(req,res){
    const { rating, productId } = req.query;
    const username = req.session.user.userName;
    pool.query('SELECT * FROM rating WHERE username=$1 AND product_id=$2', [username, productId],function (err, result) {
      if(result.rows.length > 0){
        res.send('<script>alert("You Have Rated this Product"); window.location.href = "/";</script>');
      }
      else{
        pool.query('INSERT INTO rating (rate, username, product_id) VALUES ($1, $2, $3)', [rating, username, productId], function(err, result) {
          if (err) {
            console.error(err);
          } else {
            res.redirect('/productDescription?productId=' + productId);
          }
        });
      }
  });
  })
  app.get('/profile',function(req,res){
    const username = req.session.user.userName;
    getProfileDetails(username, (error, resultArray) => {
      if (error) {
        console.log(error);
      }
      else{
        const user=resultArray;
        res.render("profile",{
          isLoggedIn:res.locals.checkLogin,
          user:user
         });
      }
    }); 
  })
  app.get('/productsBought',function(req,res){
    const username = req.session.user.userName;
    getProductsBoughtDetails(username,(error,resultArray)=>{
      if(error)
        console.log(error);
      else{
        const { titles, descriptions, prices,averageRating, imageUrls } = resultArray;
        const length=titles.length;
        res.render("productsBought",{
          isLoggedIn:res.locals.checkLogin,
          titles:titles,
          descriptions:descriptions,
          prices:prices,
          averageRating:averageRating,
          imageUrls:imageUrls,
          length:length
         });
      }  
    })
  })
  app.get('/productsSold',function(req,res){
    const username = req.session.user.userName;
    getProductsSoldDetails(username,(error,resultArray)=>{
      if(error)
        console.log(error);
      else{
        const { titles, descriptions, prices,averageRating, imageUrls } = resultArray;
        const length=titles.length;
        res.render("productsSold",{
          isLoggedIn:res.locals.checkLogin,
          titles:titles,
          descriptions:descriptions,
          prices:prices,
          averageRating:averageRating,
          imageUrls:imageUrls,
          length:length
         });
      }
    })
  })
  app.get('/initialCategorypage',function(req,res){
    res.render('initialCategorypage',{
      isLoggedIn:res.locals.checkLogin
    });
  })
  app.get('/mainCategoriesPage',function(req,res){
    const categoryName = req.query.category;
    getCategories(categoryName,(error,resultArray)=>{
      const { titles, descriptions, prices,averageRating, imageUrls,productIds,length } = resultArray;
      descriptions
      // console.log(length);
      res.render('mainCategoriesPage',{
        isLoggedIn:res.locals.checkLogin,
        titles:titles,
        descriptions:descriptions,
        prices:prices,
        averageRating:averageRating,
        imageUrls:imageUrls,
        productIds:productIds,
        categoryName:categoryName,
        length:length
      })
    })
  })

// Post Requests

// Signup
  app.post("/signup", function (req, res) {
    const { userName, name, password } = req.body;
    pool.query('SELECT * FROM users WHERE userName = $1', [userName], function(error, results) {
      if (error) {
        throw error;
      }
      if (results.rows.length > 0) {
        res.send('<script>alert("Username Already Taken"); window.location.href = "/signup";</script>');
      } else {
        pool.query('INSERT INTO users (userName, name, password) VALUES ($1, $2, $3)', [userName, name, password], function(error) {
          if (error) {
            throw error;
          }
          req.session.user = { userName };
          res.redirect('/');
        });
      }
    });
    
    // pool.query('SELECT * FROM users WHERE userName = $1', [userName],function (err, result) {
    //   if (result.rows.length > 0) {
    //     res.send('<script>alert("Username Already Taken"); window.location.href = "/signup";</script>');
    //   }
    //   else {
    //     // const query = {
    //     //   text: 'insert into users (userName,name,password) values ($1,$2,$3)',
    //     //   values: [userName, name, password]
    //     // };
    //     // pool.query(query, function (err, result) {
    //     //   if (err) {
    //     //     res.send('<script>alert("Error Creating User"); window.location.href = "/index";</script>');
    //     //   }
    //     //   else {
    //     //     req.session.user = { userName };
    //     //     pool.query('inset into users (userName,name,password),values($1,$2,$3)',[])
    //     //     res.redirect('/');
    //     //   }
    //     // })
    //     pool.query('insert into users (userName,name,password) values ($1,$2,$3)',[userName, name, password],function(error){
    //       if(error){
    //         throw error;
    //       }
    //       else{
    //         res.redirect('/');
    //       }
    //     });
    //   }
    // });
  });
// Login
 app.post("/login",function(req,res){
  const userName = req.body.userName;
  const password = req.body.password;
  pool.query("select * from users where username = $1 and password = $2",[userName,password],function(err,result){
    if(result.rows.length >0){
      req.session.user = {userName};
      res.redirect("/")
    }
    else{
      res.send('<script>alert("Wrong Email or Password. Please try again.");window.location.href = "/login";</script>');
    }
  });
 });  
//SellPagePost
app.post('/sellPagePost',upload.array('data'),function (req, res){
  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const totalItems = req.body.totalItems;
  const location = req.body.location;
  const category = req.body.category;
  const username = req.session.user.userName;

  pool.query('SELECT id FROM categories WHERE name = $1', [category], function(error, results) {
    if (error) {
      throw error;
    }
    else{
      const category_id = results.rows[0].id;
       pool.query('select id from users where username = $1',[username],function(error,results){
        if(error){
          throw error;
        }
        else{
          const user_id = results.rows[0].id;
          pool.query('insert into products (title,description,price,totalItems,location,category_id,user_id) values ($1,$2,$3,$4,$5,$6,$7) RETURNING id',[title,description,price,totalItems,location,category_id,user_id],function(error,results){
            if (error){
              throw error;
            }
            else{
              const product_id = results.rows[0].id;
              const queries = [];
              const fileData = req.files;
              for (let i = 0; i < fileData.length; i++) {
                const fileBuffer = fileData[i].buffer;
                queries.push(pool.query('INSERT INTO images (data, product_id) VALUES ($1, $2)', [fileBuffer, product_id]));
              }
              Promise.all(queries).then(() => {
                res.redirect('/');
              }).catch((error) => {
                console.log(error);
              });
            }
          });
        }
      })
    }  
  });
});
// cart
app.post('/cart',function (req, res){
  const productId = req.body.productId;
  const username = req.session.user.userName;
  pool.query('select * from cart where username =$1 and product_id =$2',[username,productId],function(error,result){
    if(error){
      console.log(error)
    }
    else{
       if (result.rows.length > 0) {
        res.send('<script>alert("Product Already Present"); window.location.href = "/";</script>');
      }
      else{
        pool.query('insert into cart (product_id,username) values ($1,$2)',[productId,username],function(error,result){
          if(error){
            console.log(error)
          }
          else{
            res.redirect('/');
          }
        })
      }
    }
  })
})
// review
app.post('/review',function(req,res){
  const username = req.session.user.userName;
  const review = req.body.review;
  const title = req.body.reviewTitle;
  const productId = req.body.productId;
  pool.query('INSERT INTO reviews (title, review, username, product_id) VALUES ($1, $2, $3,$4)', [title, review, username, productId], function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/productDescription?productId=' + productId);
    }
  });
})


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
