import {
  auth,
  db,
  collection,
  getDocs,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  // Function to handle login
  const login = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginSpinner = document.getElementById("login-spinner");

    // Show spinner before starting the login request
    if (loginSpinner) {
      loginSpinner.classList.remove('d-none'); // Show the spinner
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);

        // Save user data to sessionStorage
        sessionStorage.setItem('user', JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));

        // Redirect based on user email
        if (user.email === "admin@gmail.com") {
          location.href = "dashboard.html";
        } else {
          location.href = "index.html";
        }

        // Clear the input fields
        document.getElementById("email").value = '';
        document.getElementById("password").value = '';

        // Hide login and register buttons, show logout button
        document.getElementById("loginBtn").hidden = true;
        document.getElementById("registerBtn").hidden = true;
        document.getElementById("logoutBtn").hidden = false;

      })
      .catch((error) => {
        console.log("Error logging in: ", error.message);
      })
      .finally(() => {
        // Hide spinner after the login request is complete
        if (loginSpinner) {
          loginSpinner.classList.add('d-none'); // Hide the spinner
        }
      });
  };

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.addEventListener("click", login);

  const pageSpinner = document.getElementById("page-spinner");


  // Function to fetch and display all restaurants with their dishes
const getAllRestaurants = async () => {
  try {
      const resList = document.getElementById("res-list");
      if (resList) {
          resList.innerHTML = "";
          const restaurantsQuery = collection(db, "restaurants");
          const querySnapshot = await getDocs(restaurantsQuery);
          pageSpinner && (pageSpinner.style.display = "none");

          for (const doc of querySnapshot.docs) {
              const data = doc.data();
              if (data) {
                  // Fetch dishes for the current restaurant
                  const dishes = await getDishesByRestaurant(doc.id);

                  // Generate HTML for the dishes badges
                  const dishesHTML = dishes.map(dish => `
                      <span class="badge py-2 px-2 rounded-pill text-bg-primary">${dish.name}</span>
                  `).join('');

                  resList.innerHTML += `
                      <div class="col-12 col-md-6 col-lg-6">
                          <div class="card card-custom-margin">
                              <img src="${data.image}" class="card-img-top" alt="Restaurant Image" loading="lazy">
                              <div class="card-body card-color">
                                  <h5 class="card-title">${data.name}</h5>
                                  <p class="card-text">${data.description || 'All varieties are available'}</p>
                                  <p>${dishesHTML}</p>
                                  <a href="dishes.html?restaurant=${doc.id}" class="btn btn-primary view-dishes">View all dishes</a>
                              </div>
                          </div>
                      </div>
                  `;
              }
          }
      } else {
          console.log("Restaurant list container not found");
      }
  } catch (error) {
      console.log("Error fetching restaurants: ", error);
  }
};

// Function to fetch dishes by restaurant ID
const getDishesByRestaurant = async (restaurantId) => {
  try {
      const dishesQuery = collection(db, "dishes");
      const querySnapshot = await getDocs(dishesQuery);
      let dishes = [];

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.restaurant === restaurantId) {
              dishes.push({ ...data, id: doc.id });
          }
      });

      return dishes;
  } catch (err) {
      console.log("Error getting dishes:", err);
      return [];
  }
};


  // Handle user authentication state changes
  onAuthStateChanged(auth, (user) => {
    const userNameElem = document.getElementById("user-name");
    const userImgElem = document.getElementById("user-img");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
      console.log("User logged in", user);
      getAllRestaurants();  // Fetch restaurants if the user is logged in

      // Hide login and register buttons, show logout button
      // loginBtn.hidden = true;
      // registerBtn.hidden = true;
      // logoutBtn.hidden = false;

      // Update user information display
      userNameElem.textContent = user.displayName || user.email;
      userImgElem.src = user.photoURL || '';  // Set a default image if needed

    } 

    else {
      console.log("User not logged in");

      // Show the login modal using Bootstrap's JavaScript methods
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();

      // Show login and register buttons, hide logout button
      loginBtn.hidden = false;
      registerBtn.hidden = false;
      logoutBtn.hidden = true;

      // Clear user information display
      userNameElem.textContent = '';
      userImgElem.src = '';
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("Sign Out Success");
          // Clear session storage on sign out
          sessionStorage.removeItem('user');
          // Optionally, redirect to a different page after sign out
          location.href = 'index.html';
        })
        .catch((error) => {
          console.log("Sign out error: " + error);
        });
    });
  }

});










