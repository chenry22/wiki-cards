import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signInAnonymously, signOut, user } from '@angular/fire/auth'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  router = inject(Router);
  firestore = inject(Firestore);
  auth = inject(Auth);

  username: string = "";

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log("New user signed in!");
        this.username = localStorage.getItem('username') ?? "-error-";
      } else {
        console.log("User signed out")
        this.username = "";
        this.router.navigateByUrl('/');
      }
    });
  }

  async signIn(username: string) {
    var newUser = doc(this.firestore, "users", username);
    localStorage.setItem('username', username);
    await signInAnonymously(this.auth);
    await setDoc(newUser, { lastLogin: new Date() }, { merge: true});
    return true;
  }

  async signOut() {
    localStorage.removeItem('username');
    await signOut(this.auth);
  }
}
