import { 
    storage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc,         
    deleteDoc,   
    updateDoc,   
    getDoc,
    auth,
    onAuthStateChanged,
    serverTimestamp
} from "./firebase.js";

// Initialize cart array
let cart = [];

// Function to save cart to local storage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to load cart from local storage
function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in");
        showDishes();  // Display dishes after the user is confirmed to be logged in
    } else {
        console.log("User not logged in");
        location.href = "login.html";
        showDishes();  // Display dishes after the user is confirmed to be logged in
    }
});



// Function to fetch all restaurants and return a map of ID to name
const getRestaurantMap = async () => {
    const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantMap = {};
    restaurantSnapshot.forEach((doc) => {
        const data = doc.data();
        restaurantMap[doc.id] = data.name; // Create a map of restaurant ID to name
    });
    return restaurantMap;
};

// Function to calculate the relative time
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

// Modify the showDishes function to include relative time
const showDishes = async (searchTerm = '') => {
    const showDiv = document.getElementById('show');
    if (showDiv) {
        const restaurantMap = await getRestaurantMap();
        const querySnapshot = await getDocs(collection(db, "dishes"));
        showDiv.innerHTML = '';

        let dishesFound = false;

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

                showDiv.innerHTML += `
                <div class="col-12 col-md-6 col-lg-6">
                    <div class="card card-custom-margin">
                        ${discountText ? `<span class="discount">${discountText}</span>` : ''}
                        <img id="dashboard-img" src="${data.image}" class="card-img-top" alt="${data.name}">
                        <div class="card-body card-color">
                            <h5 class="card-title">Name: ${data.name}</h5>
                            <p class="card-text">Restaurant: ${restaurantName}</p>
                            <p class="card-text">Serving: ${data.serving}</p>
                            ${originalPriceHTML}
                            <p class="card-text time-dish ">Created: ${relativeTime}</p>
                            <button class="btn btn-primary" data-id="${doc.id}" onclick="showDishModal('${doc.id}')">Add to Cart</button>
                        </div>
                    </div>
                </div>`;
            }
        });

        if (!dishesFound) {
            showDiv.innerHTML = `<p class="text-center">Item Not Found</p>`;
        }
    } else {
        console.log("No 'show' div found!");
    }
}


// Event listener for search button
document.getElementById('searchButton').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value;
    showDishes(searchTerm);
});

// Function to display the dish details modal
async function showDishModal(id) {
    try {
        const docRef = doc(db, "dishes", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('modal-dish-image').src = data.image;
            document.getElementById('modal-dish-name').textContent = data.name;
            document.getElementById('modal-dish-price').textContent = `${data.price}`;
            document.getElementById('modal-dish-serving').textContent = `Serves: ${data.serving}`;
            document.getElementById('modal-dish-description').textContent = `Description: ${data.description || 'No description available'}`;

            const buyNowButton = document.getElementById('buyNowButton');
            buyNowButton.addEventListener('click', () => {
                const qty = 1; 
                addToCart(id, data.image, data.name, data.price, data.serving, qty);
                $('#dishModal').modal('hide');
                updateModal();
            });

            $('#dishModal').modal('show');
        } else {
            console.log("No such dish!");
        }
    } catch (error) {
        console.error("Error fetching dish details:", error);
    }
}

// Function to update the quantity of a dish
function updateQty(operation, id) {
    const qtyElement = document.getElementById(`qty-${id}`);
    let currentQty = parseInt(qtyElement.textContent);

    if (operation === '+') {
        currentQty += 1;
    } else if (operation === '-' && currentQty > 1) {
        currentQty -= 1;
    }

    qtyElement.textContent = currentQty;

    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty = currentQty;
    }

    saveCartToLocalStorage();
    updateModal();
}

// Function to add a dish to the cart
function addToCart(id, image, name, price, serving, qty = 1) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ id, image, name, price, serving, qty });
    }

    saveCartToLocalStorage();
    updateModal();
}

// Function to remove an item from the cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCartToLocalStorage();
    updateModal();
}

// Function to update the modal with cart items
function updateModal() {
    const modalBody = document.getElementById('getvalue');
    const totalAmountElement = document.getElementById('totalAmount');
    let totalAmount = 0;

    modalBody.innerHTML = ''; 

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalAmount += itemTotal;

        modalBody.innerHTML += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <img width="200" class="img-fluid rounded-start" src="${item.image}" alt="${item.name}" />
                        </div>
                        <div class="p-2">
                            <h5 class="card-title">${item.name}</h5>
                            <h6 class="card-title">Rs: ${item.price} /-</h6>
                            <p class="card-text">Serves ${item.serving}</p>
                            <p class="card-text d-flex align-items-center">
                                Quantity:
                            <div class="d-flex align-items-center m-2"> 
                                <button class="qty-btn btn btn-sm btn-outline-secondary" onclick="updateQty('-', '${item.id}')"><i class="fa-solid fa-minus"></i></button>
                                <span class="fw-bold m-2" id="qty-${item.id}">${item.qty}</span>
                                <button class="qty-btn btn btn-sm btn-outline-secondary" onclick="updateQty('+', '${item.id}')"><i class="fa-solid fa-plus"></i></button>
                            </div>
                            </p>
                            <p class="card-text">Total: Rs: ${itemTotal} /-</p>
                            <a onclick='removeFromCart("${item.id}")' class='btn btn-danger btn-sm ms-2'>Delete</a>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    totalAmountElement.textContent = `Total: PKR ${totalAmount.toFixed(2)}`;
}

// Add functions to the global scope for use in HTML attributes
window.updateQty = updateQty;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateModal = updateModal;
window.showDishModal = showDishModal;

// Function to update dashboard statistics
const updateDashboardStats = async () => {
    try {
        const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
        const totalRestaurants = restaurantSnapshot.size;
        
        const dishSnapshot = await getDocs(collection(db, "dishes"));
        const totalDishes = dishSnapshot.size;

        const pendingOrdersSnapshot = await getDocs(collection(db, "orders"));
        const totalPendingOrders = pendingOrdersSnapshot.docs.filter(doc => doc.data().status === "pending").length;

        const deliveredOrdersSnapshot = await getDocs(collection(db, "orders"));
        const totalDeliveredOrders = deliveredOrdersSnapshot.docs.filter(doc => doc.data().status === "delivered").length;

        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;

        document.getElementById('total-restaurants').textContent = totalRestaurants;
        document.getElementById('total-dishes').textContent = totalDishes;
        document.getElementById('total-orders-pending').textContent = totalPendingOrders;
        document.getElementById('total-orders-delivered').textContent = totalDeliveredOrders;
        document.getElementById('total-users').textContent = totalUsers;

    } catch (error) {
        console.error("Error updating dashboard statistics:", error);
    }
}


// Call the function to update dashboard statistics and load the cart from local storage when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    loadCartFromLocalStorage();
});

let checkoutButton = document.getElementById('checkoutBtn')
checkoutButton.addEventListener('click', () => {
    location.href = "./dishes.html";
});