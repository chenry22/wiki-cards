import { Component, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor () {
    if (this.firebase.username !== "") {
      // redirect to home
      this.nav.navigateByUrl("timer");
    }
  }

  async login() {
    console.log(this.username);
    if (this.username !== "" && await this.firebase.signIn(this.username)) {
      this.nav.navigateByUrl("timer");
    }
  }
}
