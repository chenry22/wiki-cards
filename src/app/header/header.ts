import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Firebase } from '../firebase';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, MatToolbarModule, MatButtonModule, MatMenuModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  firebase = inject(Firebase);
  router = inject(Router);

  signOut() {
    if (confirm("Are you sure you want to sign out?")) {
      this.firebase.signOut();
      this.router.navigateByUrl("/sign_in");
    }
  }
}

