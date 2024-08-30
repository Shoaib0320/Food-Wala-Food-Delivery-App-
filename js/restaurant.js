import { 
  auth,
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
  getDoc
} from "./firebase.js";

// Function to display restaurants in card layout
const loadRestaurants = async () => {
  const resList = document.getElementById("res-list");
  if (resList) {
    resList.innerHTML = "";
    const q = collection(db, "restaurants");
    const querySnapshot = await getDocs(q);
    let index = 0;
    const container = document.createElement('div');
    container.className = 'row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-3 g-4 m-2';

    querySnapshot.forEach((doc) => {
      index++;
      const data = doc.data();
      const id = doc.id;

      const card = `
        <div class="col-12 col-md-6 col-lg-6">
          <div class="card">
            <img src="${data.image}" class="card-img-top" alt="Restaurant Logo">
            <div class="card-body card-color">
              <h5 class="card-title">${data.name}</h5>
              <h6 class="card-title">${data.address}</h6>
              <div>
                <button class="btn btn-outline-primary btn-sm edit-btn" data-id="${id}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-danger btn-sm delete-btn " data-id="${id}"><i class="fa-solid fa-trash"></i></button>
              </div>
            <div>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });

    resList.innerHTML = "";
    resList.appendChild(container);

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEditRestaurant);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteRestaurant);
    });
  }
}

if(auth, (user) => {
  const userNameElem = document.getElementById("user-name");
  const userImgElem = document.getElementById("user-img");

    // Update user information display
    userNameElem.textContent = user.displayName || user.email;
    userImgElem.src = user.photoURL || '';  
})

// Call the loadRestaurants function
loadRestaurants();

// Handling file selection and preview
const logo = document.getElementById("restaurant-logo");
const selectedLogo = document.getElementById("selected-logo");
let file;

if (logo) {
  logo.addEventListener("change", (e) => {
    file = e.target.files[0];
    if (file) {
      selectedLogo.style.display = "flex";
      selectedLogo.src = URL.createObjectURL(file);
    }
  });
}

// Function to upload file to Firebase Storage and return the download URL
const uploadFile = async (file, name) => {
  try {
    const storageRef = ref(storage, `Restaurants-Images/${name.split(" ").join("-")}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// Function to handle the edit button click
const handleEditRestaurant = async (event) => {
  try {
    const id = event.target.getAttribute('data-id');
    const docRef = doc(db, "restaurants", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("edit-restaurant-name").value = data.name;
      document.getElementById("edit-restaurant-address").value = data.address;
      document.getElementById("restaurant-id").value = id;
      document.getElementById('edit-restaurant-image').file = data.image
      document.getElementById("restaurant-image-preview").src = data.image;

      const editRestaurantModal = new bootstrap.Modal(document.getElementById('edit-restaurant-modal'));
      editRestaurantModal.show();
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
  }
}

// Handling save button click to update restaurant data
document.getElementById("save-restaurant").addEventListener("click", async () => {
  try {
    const id = document.getElementById("restaurant-id").value;
    const name = document.getElementById("edit-restaurant-name").value;
    const address = document.getElementById("edit-restaurant-address").value;

    let imageUrl = document.getElementById("restaurant-image-preview").src;
    const imageFile = document.getElementById("edit-restaurant-image").files[0];

    if (imageFile) {
      // Upload new image and get the URL
      imageUrl = await uploadFile(imageFile, `restaurant_${id}`);
    }

    const docRef = doc(db, "restaurants", id);
    await updateDoc(docRef, {
      name: name,
      address: address,
      image: imageUrl
    });

    const editRestaurantModal = bootstrap.Modal.getInstance(document.getElementById('edit-restaurant-modal'));
    editRestaurantModal.hide();

    loadRestaurants(); // Reload the restaurants
  } catch (error) {
    console.error('Error updating restaurant:', error);
  }
});

// Function to handle the delete button click
const handleDeleteRestaurant = async (event) => {
  try {
    const id = event.target.getAttribute('data-id');
    const docRef = doc(db, "restaurants", id);
    await deleteDoc(docRef);
    loadRestaurants(); // Reload the restaurants
  } catch (error) {
    console.error('Error deleting restaurant:', error);
  }
}


//  Handling restaurant submission and storing it in Firestore
  const submitRestaurant = document.getElementById("submit-restaurant");
  if (submitRestaurant) {
    submitRestaurant.addEventListener('click', async () => {
      const closeBtn = document.getElementById("close-btn");
      const spinner = document.getElementById("restaurant-spinner");
      const name = document.getElementById("restaurant-name");
      const address = document.getElementById("restaurant-address");
  
      if (name && address && file) {
        spinner.style.display = "block";
  
        try {
          const image = await uploadFile(file, name.value);
          const docRef = await addDoc(collection(db, "restaurants"), {
            name: name.value,
            address: address.value,
            image
          });
  
          console.log("Document written with ID: ", docRef.id);
          spinner.style.display = "none";
  
          // Clear form and refresh the restaurant list
          name.value = "";
          address.value = "";
          logo.value = "";
          selectedLogo.style.display = "none";
          loadRestaurants();
  
          if (closeBtn) {
            closeBtn.click();
          }
        } catch (error) {
          console.error("Error adding document: ", error);
          spinner.style.display = "none";
        }
      } else {
        alert("Please fill in all fields and select a logo.");
      }
    });
  }