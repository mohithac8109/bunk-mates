// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA",
    authDomain: "bunk-mates-beccc.firebaseapp.com",
    projectId: "bunk-mates-beccc",
    storageBucket: "bunk-mates-beccc.firebasestorage.app",
    messagingSenderId: "37810808180",
    appId: "1:37810808180:web:94ca726e3c8f195a26f821",
    measurementId: "G-Y78WBDGF5Z"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
