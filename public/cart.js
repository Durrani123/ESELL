
var cartHeading = document.getElementById("cartLink");
var mainCart = document.getElementById("mainCart");

cartHeading.addEventListener("click", function() {
  document.body.classList.add("bodyCart");
  if (mainCart.classList.contains("cartVisibility")) {
    mainCart.classList.remove("cartVisibility");
    mainCart.classList.add("cartVisibilityToggle");
  }
});

var cartGoBack = document.getElementById("cartGoBack");
cartGoBack.addEventListener("click",function(){
  document.body.classList.remove("bodyCart");
  if (mainCart.classList.contains("cartVisibilityToggle")) {
    mainCart.classList.remove("cartVisibilityToggle");
    mainCart.classList.add("cartVisibility");
    mainCart.classList.add("cartSlideOut");
  }
});

