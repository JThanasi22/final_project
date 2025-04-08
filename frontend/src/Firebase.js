import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
    apiKey: "AIzaSyB-NLJ2lyjWWhyAWclX-kFFRTAnt-ZHGKk",
    authDomain: "awesome-photographic-studio.firebaseapp.com",
    projectId: "awesome-photographic-studio",
    storageBucket: "awesome-photographic-studio.firebasestorage.app",
    messagingSenderId: "146728697992",
    appId: "1:146728697992:web:e7ab03a9885fcdda54df3d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);