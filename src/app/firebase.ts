import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signInAnonymously, user } from '@angular/fire/auth'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  router = inject(Router);
  firestore = inject(Firestore);
  auth = inject(Auth);

  uid: string = "";
  username: string = "";

  constructor() {
    var usernameCheck = localStorage.getItem('username');
    if (this.auth.currentUser != null && usernameCheck != null) {
      this.username = usernameCheck;
      this.router.navigateByUrl('/timer');
    }

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log("New user signed in!");
         this.uid = user.uid;
      } else {
        // signed out
      }
    });
  }

  async signIn(username: string) {
    var newUser = doc(this.firestore, "users", username);
    await signInAnonymously(this.auth);
    await setDoc(newUser, { lastLogin: new Date() }, { merge: true});
    this.username = username;
    localStorage.setItem('username', username);
    return true;
  }
}
