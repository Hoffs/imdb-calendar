import firebase from 'firebase/app';
import 'firebase/auth';

import firebaseAppConfig from '../../firebase-app.json';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseAppConfig);
}

export default firebase;
