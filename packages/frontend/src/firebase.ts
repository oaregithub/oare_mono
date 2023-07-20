import firebase from 'firebase/app';
import 'firebase/auth';

/**
 * The configuration for the Firebase app.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDpIFs9456JIobouGi7sDz0MROnHR8Oja0',
  authDomain: 'oareauth.firebaseapp.com',
  projectId: 'oareauth',
  storageBucket: 'oareauth.appspot.com',
  messagingSenderId: '69358515492',
  appId: '1:69358515492:web:8e792c4448147887e9afb1',
  measurementId: 'G-59Z6RJEKYC',
};

// Initilize the Firebase app.
firebase.initializeApp(firebaseConfig);

export default firebase;
