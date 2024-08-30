import {
  auth,
  signInWithEmailAndPassword,
  db,
  collection,
  getDocs,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider, // Ensure this is imported
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "./js/firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const login = () => {
    console.log("Logging in");

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (email && password) {
      signInWithEmailAndPassword(auth, email.value, password.value)
        .then((userCredential) => {
          email.innerHTML=''
          const user = userCredential.user;
          console.log(user);
          
          // Check if user is logged in
          if (user) {
            if (user.email === "admin@gmail.com") {
              location.href = "dashboard.html";
            } else {
              location.href = "index.html";
            }
          } else {
            console.log("No user is logged in.");
            document.getElementById('loginError').innerText = "Login failed. Please check your credentials.";
          }
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log("Error: ", errorMessage);
          console.log("Error Code: ", errorCode);
          document.getElementById('loginError').innerText = `Error: ${errorMessage} (Code: ${errorCode})`;
        });
    } else {
      console.log("Email or password field is missing");
      document.getElementById('loginError').innerText = "Email or password field is missing.";
    }
  };

  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {    
    loginBtn.addEventListener("click", login);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Get the current user
      const user = auth.currentUser;

      if (user) {
        // Log user's email and name to the console
        console.log("User email: ", user.email);
        console.log("User name: ", user.displayName);

        // Sign out the user
        signOut(auth)
          .then(() => {
            console.log("Sign Out Success");
            // Optionally, redirect to a different page after sign out
            location.href = 'index.html';
          })
          .catch((error) => {
            console.log("Sign out error: " + error);
            document.getElementById('loginError').innerText = "Sign out error: " + error.message;
          });
      } else {
        console.log("No user is signed in.");
        document.getElementById('loginError').innerText = "No user is signed in.";
      }
    });
  }

  const provider = new GoogleAuthProvider();
  const signupWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        console.log(user);
        alert(user.displayName);
        console.log(user.displayName);
        location.href = "index.html";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.log("Error during Google sign-in:", error);
        document.getElementById('loginError').innerText = `Google sign-in error: ${errorMessage} (Code: ${errorCode})`;
      });
  };

  const googleBtn = document.getElementById("googleSignInBtn");
  if (googleBtn) {
    googleBtn.addEventListener("click", signupWithGoogle);
  }
});
