// Import Firebase functions (adjust import paths as needed)
import {
  auth,
  collection,
  getDocs,
  db,
  where,
  query,
  doc,
  getDoc,
} from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search);
const pageSpinner = document.getElementById("page-spinner");
const mainContent = document.getElementById("main-content");
const cartElement = document.getElementById("cart");
const deliveryChargesElement = document.getElementById("deliveryCharges");
const totalAmountElement = document.getElementById("totalAmount");

let deliveryCharges = 0; // Initialize delivery charges
let cart = JSON.parse(localStorage.getItem("cart")) || []; // Initialize cart from localStorage
let dishes = []; // Initialize dishes array

// Ensure cart is an array
if (!Array.isArray(cart)) {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Fetch restaurant details and display them
const getRestaurantDetail = async () => {
  try {
    const docRef = doc(db, "restaurants", urlParams.get("restaurant"));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById("res-name").innerHTML = docSnap.data().name;
      document.getElementById("res-address").innerHTML = docSnap.data().address;
      document.getElementById("res-image").src = docSnap.data().image;

      // Fetch and display the dishes for the restaurant as badges
      await getAllDishesAsBadges(docRef.id);
      
    } else {
      console.error("No such document!");
    }
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
  }
};

const getRelativeTime = (timestamp) => {
  const now = new Date();
  const timeDiff = now - timestamp;

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(timeDiff / 60000);
  const hours = Math.floor(timeDiff / 3600000);
  const days = Math.floor(timeDiff / 86400000);

  if (seconds < 60) {
      return 'Just Now';
  } else if (minutes < 60) {
      return minutes === 1 ? '1 Minute ago' : `${minutes} Minutes ago`;
  } else if (hours < 24) {
      return hours === 1 ? '1 Hour ago' : `${hours} Hours ago`;
  } else {
      return days === 1 ? '1 Day ago' : `${days} Days ago`;
  }
};

// Function to fetch and display dishes as badges
const getAllDishesAsBadges = async (restaurantId) => {
  try {
    const badgesContainer = document.getElementById('badges-container');
    const q = query(
      collection(db, "dishes"),
      where("restaurant", "==", restaurantId)
    );
    const querySnapshot = await getDocs(q);

    // Clear existing badges
    badgesContainer.innerHTML = '';

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const badge = document.createElement('span');
      badge.className = 'badge rounded-pill text-bg-primary';
      badge.innerText = data.name;
      badgesContainer.appendChild(badge);
    });

    if (querySnapshot.empty) {
      badgesContainer.innerHTML = '<p>No dishes found for this restaurant.</p>';
    }
  } catch (error) {
    console.error("Error fetching dishes as badges:", error);
  }
};

// Fetch all dishes and display them
const getAllDishes = async (searchTerm = '') => {
  try {
    const showDiv = document.getElementById('all-dishes');
    const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantMap = {};
    restaurantSnapshot.forEach((doc) => {
      const data = doc.data();
      restaurantMap[doc.id] = data.name;
    });

    const q = query(
      collection(db, "dishes"),
      where("restaurant", "==", urlParams.get("restaurant"))
    );
    const querySnapshot = await getDocs(q);

    mainContent.style.display = "block";
    showDiv.innerHTML = '';

    let dishesFound = false;
    dishes = []; // Reset dishes array

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === '') {
        dishesFound = true;

        let discountText = '';
        if (data.discount && data.price) {
          discountText = `${data.discount}% OFF`;
        }

        let originalPriceHTML = '';
        if (data.originalPrice) {
          originalPriceHTML = data.price ?
            `<p class="price">Rs. ${data.price} <span>Rs. ${data.originalPrice}</span></p>` :
            `<p class="price">Rs. ${data.originalPrice}</p>`;
        } else if (data.price) {
          originalPriceHTML = `<p class="price">Rs. ${data.price}</p>`;
        }

        const restaurantName = restaurantMap[data.restaurant] || 'Unknown Restaurant';
        const createdAt = data.createdAt?.toDate();
        const relativeTime = createdAt ? getRelativeTime(createdAt) : 'Unknown time';

        dishes.push({ id: doc.id, ...data }); // Populate dishes array

        showDiv.innerHTML += `
        <div class="col-12 col-md-6 col-lg-6">
          <div class="card card-custom-margin">
            ${discountText ? `<span class="discount">${discountText}</span>` : ''}
            <img id="dish-img" src="${data.image}" class="card-img-top" alt="${data.name}">
            <div class="card-body card-color">
              <h5 class="card-title">Name: ${data.name}</h5>
              <p class="card-text">Restaurant: ${restaurantName}</p>
              <p class="card-text">Serving: ${data.serving}</p>
              ${originalPriceHTML}
              <p class="card-text time-dish">Created: ${relativeTime}</p>
              <div class="d-flex align-items-center gap-2 w-100 justify-content-between">
                <div class="d-flex align-items-center gap-2">
                  <button onclick="updateQty('-', '${doc.id}')" class="qty-btn"><i class="fa-solid fa-minus"></i></button>
                  <span class="fw-bold" id="${doc.id}">1</span>
                  <button onclick="updateQty('+', '${doc.id}')" class="qty-btn"><i class="fa-solid fa-plus"></i></button>
                </div>
                <a href="#" class="btn btn-primary" onclick="addToCart('${doc.id}')">Add to cart</a>
              </div>
            </div>
          </div>
        </div>`;
      }
    });

    if (!dishesFound) {
      showDiv.innerHTML = `<p class="text-center">Item Not Found</p>`;
    }
  } catch (error) {
    console.error("Error fetching dishes:", error);
  }

  generateRandomDeliveryCharges(); // Generate and display random delivery charges
};

// Function to update quantity
window.updateQty = (type, id) => {
  const qty = document.getElementById(id);
  if (Number(qty.innerHTML) < 2 && type === "-") {
    return;
  }
  if (type === "+") {
    qty.innerHTML = Number(qty.innerHTML) + 1;
  } else {
    qty.innerHTML = Number(qty.innerHTML) - 1;
  }
};

// Function to add dish to cart
window.addToCart = (dishId) => {
  const qty = Number(document.getElementById(dishId).innerHTML);
  const dishData = dishes.find(dish => dish.id === dishId);
  if (dishData) {
    const existingItemIndex = cart.findIndex(item => item.id === dishId);
    if (existingItemIndex !== -1) {
      cart[existingItemIndex].qty += qty;
    } else {
      cart.push({ ...dishData, qty });
    }
    saveCartToLocalStorage();
    getCartItems();
    updateTotalAmount();
  } else {
    console.error(`Dish with ID ${dishId} not found in dishes array.`);
  }
};

// Function to save cart to localStorage
function saveCartToLocalStorage() {
  if (Array.isArray(cart)) {
    localStorage.setItem('cart', JSON.stringify(cart));
  } else {
    console.error("Cart is not an array:", cart);
  }
}

// Function to generate random delivery charges
const generateRandomDeliveryCharges = () => {
  deliveryCharges = Math.floor(Math.random() * 2051) + 50;
  deliveryChargesElement.innerText = `Rs ${deliveryCharges} /-`;
  updateTotalAmount();
  localStorage.setItem("deliveryCharges", deliveryCharges); // Save delivery charges to localStorage
};

// Function to update total amount
const updateTotalAmount = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const sum = cartItems.reduce((a, b) => a + Number(b.price) * b.qty, 0);
  totalAmountElement.innerHTML = `Rs ${sum + deliveryCharges} /-`;
};

// Function to get and display cart items
// const getCartItems = () => {
//   const cartElement = document.getElementById("cart");
//   cartElement.innerHTML = "";
//   cart.forEach((item) => {
//     cartElement.innerHTML += `
//       <div class="card dish-card w-100 mb-3">
//          <div class="card-body">
//            <div class="d-flex align-items-center justify-content-between">
//              <div class="d-flex align-items-center">
//                <img class="dish-cart-image" src="${item.image}" alt="${item.name}" />
//                <div class="p-2">
//                  <h5 class="card-title">${item.name}</h5>
//                  <h3 class="card-title">Rs: ${item.price} /- x ${item.qty} = ${item.price * item.qty}</h3>
//                  <p class="card-text">Serves ${item.serving}</p>
//                </div>
//              </div>
//              <a href="#" style="width: auto;"  onclick="deleteCartItem('${index}')" class="btn btn-primary">
//                <i class="fa-solid fa-trash"></i>
//              </a>
//            </div>
//          </div>
//        </div>`;
//   });
// };

const getCartItems = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  cartElement.innerHTML = "";
  if (cartItems.length > 0) {
    cartItems.forEach((item, index) => {
      cartElement.innerHTML += `
        <div class="card dish-card w-100 mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <img class="dish-cart-image" src="${item.image}" alt="${item.name}" />
                <div class="p-2">
                  <h5 class="card-title">${item.name}</h5>
                  <h3 class="card-title">Rs: ${item.price} /- x ${item.qty} = ${item.price * item.qty}</h3>
                  <p class="card-text">Serves ${item.serving}</p>
                </div>
              </div>
              <a href="#" style="width: auto;"  onclick="deleteCartItem('${index}')" class="btn btn-primary">
                <i class="fa-solid fa-trash"></i>
              </a>
            </div>
          </div>
        </div>`;
    });
  } else {
    cartElement.innerHTML = "<p>Your cart is empty.</p>";
  }
};

// Function to remove item from cart
window.removeItemFromCart = (dishId) => {
  cart = cart.filter(item => item.id !== dishId);
  saveCartToLocalStorage();
  getCartItems();
  updateTotalAmount();
};

// Event listener for 'DOMContentLoaded'
window.addEventListener("DOMContentLoaded", async () => {

  let circularProgress = document.querySelector(".circular-progress"),
          progressValue = document.querySelector(".progress-value");

      let progressStartValue = 0,    
          progressEndValue = 90,    
          speed = 12;
          
      let progress = setInterval(() => {
          progressStartValue++;

          progressValue.textContent = `${progressStartValue}%`
          circularProgress.style.background = `conic-gradient(#7d2ae8 ${progressStartValue * 3.6}deg, #ededed 0deg)`

          if(progressStartValue == progressEndValue){
              clearInterval(progress);
              circularProgress.style.display = "none"
              mainContent.style.display = "block";
              getRestaurantDetail(); // Fetch and display restaurant details and dishes as badges
              getCartItems();

              getAllDishes();


          }    
      }, speed);

  // pageSpinner.style.display = "block";
  // await getRestaurantDetail(); // Fetch and display restaurant details and dishes as badges
  // getCartItems();
  // setTimeout(() => {
  //   pageSpinner.style.display = "none";
  // }, 15);
  // await getAllDishes();
});
