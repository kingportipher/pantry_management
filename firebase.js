// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOR70ioeUxE4g9ofVuHFTC7w9XcJcbm4w",
  authDomain: "pantry-management-aa0e2.firebaseapp.com",
  projectId: "pantry-management-aa0e2",
  storageBucket: "pantry-management-aa0e2.appspot.com",
  messagingSenderId: "333246589209",
  appId: "1:333246589209:web:a04c0f31881f290362bd88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)

export { firestore }