import { Component, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { onAuthStateChanged } from '@angular/fire/auth';
import { MatDividerModule } from '@angular/material/divider';

interface User {
  username: string,
  lastLogin: Date
};

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, MatDividerModule],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
export class AccountPage {
  firebase = inject(Firebase);
  nav = inject(Router);
  private route = inject(ActivatedRoute);

  username = "";
  email: string = "";
  password = "";

  signIn = true;
  loading = false;

  constructor () {
    onAuthStateChanged(this.firebase.auth, (user) => {
      if (user) {
        this.nav.navigateByUrl("");
      }
    });

    this.route.data.subscribe(data => {
      this.signIn = !data['create'];
    });
  }

  async login() {
    this.loading = true;
    if (this.email === "" || this.password === "") {
      this.loading = false;
      return;
    }
    
    if (await this.firebase.signIn(this.email, this.password)) {
      this.nav.navigateByUrl("");
    } else {
      alert("Unrecognized email or password");
    }
    this.loading = false;
  }

  async signUp() {
    this.loading = true;
    if (this.username === "") {
      alert("Please enter a valid username")
    } else if (this.email === "") {
      alert("Please enter an email")
    } else if (this.password === "") {
      alert("Please enter a password")
    } else if (await this.firebase.createAccount(this.username, this.email, this.password)) {
      this.nav.navigateByUrl("");
    } else {
      alert("That username is already taken.");
    }
    this.loading = false;
  }

  swapView() {
    this.username = '';
    this.password = '';
    this.email = '';
    this.signIn = !this.signIn;
  }
}
