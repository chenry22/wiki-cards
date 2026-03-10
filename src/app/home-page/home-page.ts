import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Firebase } from '../firebase';
import { onAuthStateChanged } from '@angular/fire/auth';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  firebase = inject(Firebase);

  loading = true;
  loggedIn = false;
  claimed = false;
  hoursTilDailyPack = 1;

  constructor() {
    onAuthStateChanged(this.firebase.auth, (user) => {
      if (user) {
        this.loggedIn = true;
        this.getHoursTil();
      } else {
        this.loading = false;
      }
    });
  }

  async getHoursTil() {
    this.hoursTilDailyPack = await this.firebase.hoursUntilDailyPack();
    this.loading = false;
  }

  async claimDailyPack() {
    if (this.hoursTilDailyPack > 0) {
      return;
    }
    
    this.loading = true;
    if (await this.firebase.claimDailyPack()) {
      this.claimed = true;
      this.hoursTilDailyPack = 24;
    }
    this.loading = false;
  }
}
