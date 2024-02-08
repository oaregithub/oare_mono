import firebase from 'firebase/app';
import 'firebase/auth';

/**
 * Firebase configuration.
 * It is okay to expose this configuration, as it is not sensitive.
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

/**
 * Initialized Firebase instance.
 */
export default firebase;
