import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyARrOei2cyXzY2nuBxF5ATWbBrAzHQTn-E',
  authDomain:        'serendipitydata-application.firebaseapp.com',
  projectId:         'serendipitydata-application',
  storageBucket:     'serendipitydata-application.firebasestorage.app',
  messagingSenderId: '979215337876',
  appId:             '1:979215337876:web:06586f8ddeddcc1372a781',
}

const app = initializeApp(firebaseConfig)
export const db  = getFirestore(app)
