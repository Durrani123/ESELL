var profileLink = document.getElementById("profileLink");
var mainProfile = document.getElementById("mainProfile");

profileLink.addEventListener("click", function() {
  document.body.classList.add("bodyCart");
  if (mainProfile.classList.contains("cartVisibility")) {
    mainProfile.classList.remove("cartVisibility");
    mainProfile.classList.add("cartVisibilityToggle");
  }
});

var profileGoBack = document.getElementById("profileGoBack");
profileGoBack.addEventListener("click",function(){
  document.body.classList.remove("bodyCart");
  if (mainProfile.classList.contains("cartVisibilityToggle")) {
    mainProfile.classList.remove("cartVisibilityToggle");
    mainProfile.classList.add("cartVisibility");
  }
});
