document.getElementById("logout-btn").addEventListener("click", function () {
    // Clear session storage or local storage
    localStorage.clear();
    sessionStorage.clear();
  
    // Redirect to login page
    window.location.href = "Login.html"; // Change this to your login page URL
  });
  

  //slider home
  function findSupplier() {
    alert('Redirecting to Supplier Page...');
    window.location.href = 'supplier-page.html'; // Replace with actual supplier page URL
}

function findBuyer() {
    alert('Redirecting to Buyer Page...');
    window.location.href = 'buyer-page.html'; // Replace with actual buyer page URL
}




//becomw a seller
function toggleForm(userType) {
  if (userType === "seller") {
      window.location.href = "file:///D:/SHRIJAIV%20Site/Become%20a%20seller.html";
  } else if (userType === "buyer") {
      window.location.href = "file:///D:/SHRIJAIV%20Site/Become%20a%20buyer.html";
  }
}




//sign up
function nextForm(step) {
  document.querySelectorAll('.form-section').forEach(section => {
      section.classList.remove('active');
  });
  document.getElementById('step-' + step).classList.add('active');
}

function previousForm(step) {
  document.querySelectorAll('.form-section').forEach(section => {
      section.classList.remove('active');
  });
  document.getElementById('step-' + step).classList.add('active');
}





//seller page 
function findSupplier() {
  alert('Redirecting to Supplier Page...');
  window.location.href = 'supplier-page.html'; // Replace with actual supplier page URL
}

function findBuyer() {
  alert('Redirecting to Buyer Page...');
  window.location.href = 'buyer-page.html'; // Replace with actual buyer page URL
}
document.addEventListener("DOMContentLoaded", function () {
const stars = document.querySelectorAll(".star");

stars.forEach(star => {
    star.addEventListener("click", function () {
        const value = this.getAttribute("data-value");
        stars.forEach(s => s.classList.remove("active"));
        for (let i = 0; i < value; i++) {
            stars[i].classList.add("active");
        }
    });
});
});



//seller btn
function findSupplier() { window.location.href = 'supplier-page.html'; }
function findBuyer() { window.location.href = 'buyer-page.html'; }

//Script to Toggle Filters on Mobile 

document.getElementById("toggle-filters").addEventListener("click", function () {
  var filterContainer = document.getElementById("filter-container");
  filterContainer.classList.toggle("d-none");
});