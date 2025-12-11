import { Component, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { onAuthStateChanged } from '@angular/fire/auth';

interface User {
  username: string,
  lastLogin: Date
};

@Component({
  selector: 'app-account-page',
  imports: [FormsModule],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
export class AccountPage {
  username: string = "";
  firebase = inject(Firebase);
  nav = inject(Router);

  loading = false;

  constructor () {
    onAuthStateChanged(this.firebase.auth, (user) => {
      if (user) {
        console.log("New user signed in!");
        this.nav.navigateByUrl("");
      }
    });
  }

  async login() {
    this.loading = true;
    this.username = this.username.toLowerCase();
    if (this.username !== "" && await this.firebase.signIn(this.username)) {
      this.nav.navigateByUrl("");
    }
    this.loading = false;
  }
}
