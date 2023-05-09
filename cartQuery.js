const { express, app, bodyParser, ejs, session, pgSession, Pool, pool,upload } = require('./module.js');

function getCartItems(username, callback) {
  if(username){
  pool.query('select product_id from cart where username =$1',[username],function(error,result){
    if(error){
      console.log(error)
    }
    else{
      const cartItems = result.rows.map(row => ({
        productId: row.product_id
      }));
      const resultArray = [];
      if(cartItems.length === 0){
        let totalPrice=0;
        callback(null, {resultArray,totalPrice});
      } 
      for (const item of cartItems) {
        const productId = item.productId;
        pool.query('SELECT title, description, price FROM products WHERE id = $1', [productId], (error, result) => {
          if (error) {
            console.log(error);
          }
          else{
            const {title, description, price} = result.rows[0];
            pool.query('select data from images where product_id = $1',[productId],function(error,result){
              if(error){
                console.log(error);
              }
              else{
                const data = result.rows[0].data;
                const base64Data = data.toString('base64');
                const imageUrl = 'data:image/png;base64,' + base64Data;
                let maxCharacters = 20;
                let truncatedText = description.substring(0, maxCharacters) + "...";
                resultArray.push({title, truncatedText,price,imageUrl});

                if (resultArray.length === cartItems.length) {
                  let totalPrice=0;
                  resultArray.forEach(function(item) {
                    totalPrice+=item.price;
                  });
                  callback(null, {resultArray,totalPrice});
              }
            }
            })
          }
        })
    }
  }
  })
}else{
  let resultArray = [];
  let totalPrice = 0;
  callback(null, {resultArray,totalPrice});
}
}
function getReviews(productId,callback){
  pool.query('select title,review,username,dates from reviews where product_id =$1',[productId],function(error,result){
    if(error){
      console.log(error)
    }
    else{
      const reviewArray = result.rows.map(row => {
        return {
          title:row.title,
          review: row.review,
          username: row.username,
          dates: row.dates.toLocaleDateString()
        };
      });
      callback(null, reviewArray);
    }
  })
}
function trendingItems(callback){
  pool.query('SELECT product_id, COUNT(*) AS total_sold FROM orders GROUP BY product_id ORDER BY total_sold DESC LIMIT 3;',function(err, result){
      if (err) {
        console.error(err);
      }
      const productIds = result.rows.map(row => row.product_id);
      productIds.sort((a, b) => a - b);
      callback(null, productIds);
    });
}

function get4products(callback){
  pool.query('SELECT id FROM products LIMIT 3;',function(err, result){
    if (err) {
      console.error(err);
    }
    const productIds = result.rows.map(row => row.id);
    callback(null, productIds);
  });
}

function get4productsDetails(productIds,callback){
  pool.query('SELECT title, description, price, location, category_id FROM products WHERE id = ANY($1)', [productIds], function(error, result) {
    if (error) 
      console.log(error);
    else {
      const data = result.rows;
      const categoryIds = data.map(row => row.category_id);
      const titles = result.rows.map(row => row.title);
      let maxCharacters = 20;
      const descriptions = result.rows.map(row => row.description.substring(0,maxCharacters));
      const prices = result.rows.map(row => row.price);
      const locations = result.rows.map(row => row.location);
      pool.query('select name from categories where id = ANY($1)',[categoryIds],function(error,result){
        if(error)
          console.log(error);
        else{
          const categoryName = result.rows.map(row =>row.name);
          pool.query('SELECT DISTINCT ON (product_id) data,id FROM images WHERE product_id = ANY($1) ORDER BY product_id, id',[productIds],function(error,result){
            if(error)
              console.log(error);
              else{
                const images = result.rows.map(row => row.data.toString('base64'));
                const imageUrls = images.map(base64 => 'data:image/png;base64,' + base64);
                pool.query('SELECT AVG(rate) AS averagerating FROM rating WHERE product_id = ANY($1) GROUP BY product_id  ORDER BY product_id', [productIds],function(err, result){
                  if (err) {
                    console.log(err);
                  } else {
                      const averageRating = result.rows.map(row=>row.averagerating);
                      callback(null,{
                      titles: titles,
                      descriptions: descriptions,
                      prices: prices,
                      locations: locations,
                      categoryNames: categoryName,
                      imageUrls: imageUrls,
                      averageRating:averageRating
                    });
              }
              })
              }
          })
        }
      })
    }
  })
}
function getProfileDetails(userName,callback){
  if (userName){
  pool.query('SELECT name, password,id FROM users WHERE username = $1', [userName],function (error, result) {
    if (error) {
      console.log(error);
    } else {
      const name = result.rows[0].name;
      const user_id = result.rows[0].id;
      const password = result.rows[0].password;
      pool.query('SELECT COUNT(*) FROM orders WHERE username = $1', [userName], function(error, result) {
        if (error) {
          console.log(error);
        } else {
          const productsBought = result.rows[0].count;
          pool.query('SELECT id FROM products WHERE user_id = $1', [user_id], function(error, result) {
            if (error) {
              console.log(error);
            } else {
              const productIds = result.rows.map(row => row.id);
              pool.query('SELECT COUNT(*) FROM orders WHERE product_id = ANY($1)', [productIds], function(error, result) {
                if (error) {
                  console.log(error);
                } else {
                  const productsSold = result.rows[0].count;
                  const user = {
                    userName: userName,
                    name: name,
                    password:password,
                    productsBought:productsBought,
                    productsSold:productsSold 
                  };
                  callback(null,user);
                }
              });
            }
          });
        }
      });
    }
  });
}
else{
  let user=[];
  callback(null,user);
}
}
function getProductsBoughtDetails(userName,callback){
  pool.query('SELECT distinct(product_id) FROM orders where username = ($1)',[userName],function(err, result){
    if (err) {
      console.error(err);
    }
    const productIds = result.rows.map(row => row.product_id);
    productIds.sort((a, b) => a - b);
    pool.query('SELECT title, description, price FROM products WHERE id = ANY($1)', [productIds], function(error, result) {
      if (error) 
        console.log(error);
      else{
        const data = result.rows;
        const titles = result.rows.map(row => row.title);
        const descriptions = result.rows.map(row => row.description);
        const prices = result.rows.map(row => row.price);
        pool.query('SELECT DISTINCT ON (product_id) data,id FROM images WHERE product_id = ANY($1) ORDER BY product_id, id',[productIds],function(error,result){
          if(error)
            console.log(error);
            else{
              const images = result.rows.map(row => row.data.toString('base64'));
              const imageUrls = images.map(base64 => 'data:image/png;base64,' + base64);
              pool.query('SELECT AVG(rate) AS averagerating FROM rating WHERE product_id = ANY($1) GROUP BY product_id  ORDER BY product_id', [productIds],function(err, result){
                if (err) {
                  console.log(err);
                } else {
                  const averageRating = result.rows.map(row=>row.averagerating);
                  callback(null,{
                    titles: titles,
                    descriptions: descriptions,
                    prices: prices,
                    averageRating:averageRating,
                    imageUrls: imageUrls
                  });
                }
              });
            }
        })
      }
    });
  });
}
function getProductsSoldDetails(username,callback){
  pool.query('SELECT id FROM users WHERE username = $1', [username],function (error, result) {
    if (error)
      console.log(error);
    else {
      const user_id = result.rows[0].id;
      pool.query('SELECT id FROM products WHERE user_id = $1', [user_id], function(error, result) {
      if (error) 
        console.log(error);
      else {
        const productIds1 = result.rows.map(row => row.id);
        productIds1.sort((a, b) => a - b);
        pool.query('SELECT distinct(product_id) FROM orders WHERE product_id = any($1)', [productIds1], function(error, result) {
          if (error) 
            console.log(error);
          else {
            const productIds = result.rows.map(row => row.product_id);
            productIds.sort((a, b) => a - b);
            pool.query('SELECT title, description, price FROM products WHERE id = ANY($1)', [productIds], function(error, result) {
              if (error) 
                console.log(error);
              else{
                const data = result.rows;
                const titles = result.rows.map(row => row.title);
                const descriptions = result.rows.map(row => row.description);
                const prices = result.rows.map(row => row.price);
                pool.query('SELECT DISTINCT ON (product_id) data,id FROM images WHERE product_id = ANY($1) ORDER BY product_id, id',[productIds],function(error,result){
                  if(error)
                    console.log(error);
                    else{
                      const images = result.rows.map(row => row.data.toString('base64'));
                      const imageUrls = images.map(base64 => 'data:image/png;base64,' + base64);
                      pool.query('SELECT AVG(rate) AS averagerating FROM rating WHERE product_id = ANY($1) GROUP BY product_id  ORDER BY product_id', [productIds],function(err, result){
                        if (err) {
                          console.log(err);
                        } else {
                          const averageRating = result.rows.map(row=>row.averagerating);
                          callback(null,{
                            titles: titles,
                            descriptions: descriptions,
                            prices: prices,
                            averageRating:averageRating,
                            imageUrls: imageUrls
                          });
                        }
                      });
                    }
                })
              }
            });
          }
        })
      }
      })
    }
  })
}

function getCategories(name,callback){
  pool.query('select id from categories where name = $1',[name],function(err,result){
    if(err)
      console.log(err);
    else{
      const categoryId = result.rows[0].id;
      pool.query('SELECT id FROM products WHERE category_id = $1', [categoryId], function(error, result) {
        if (error) 
          console.log(error);
        else {
          const productIds = result.rows.map(row => row.id);
          productIds.sort((a, b) => a - b);
          pool.query('SELECT title, description, price, location FROM products WHERE id = ANY($1)', [productIds], function(error, result) {
            if (error) 
              console.log(error);
            else{
              const data = result.rows;
              const titles = result.rows.map(row => row.title);
              let maxCharacters = 20;
              const descriptions = result.rows.map(row => row.description.substring(0,maxCharacters));
              const prices = result.rows.map(row => row.price);
              const location = result.rows.map(row => row.location);

              pool.query('SELECT DISTINCT ON (product_id) data,id FROM images WHERE product_id = ANY($1) ORDER BY product_id, id',[productIds],function(error,result){
                if(error)
                  console.log(error);
                  else{
                    const images = result.rows.map(row => row.data.toString('base64'));
                    const imageUrls = images.map(base64 => 'data:image/png;base64,' + base64);
                    pool.query('SELECT AVG(rate) AS averagerating FROM rating WHERE product_id = ANY($1) GROUP BY product_id  ORDER BY product_id', [productIds],function(err, result){
                      if (err) {
                        console.log(err);
                      } else {
                        const averageRating = result.rows.map(row=>row.averagerating);
                        const length = titles.length;
                        // const 
                        callback(null,{
                          titles: titles,
                          descriptions: descriptions,
                          prices: prices,
                          averageRating:averageRating,
                          imageUrls: imageUrls,
                          productIds:productIds,
                          length:length
                        });
                      }
                    });
                  }
              })
            }
          });
        }
      })
    }
  })
}

module.exports = { getCartItems,getReviews,trendingItems,get4products,get4productsDetails,getProfileDetails,getProductsBoughtDetails,getProductsSoldDetails,getCategories };