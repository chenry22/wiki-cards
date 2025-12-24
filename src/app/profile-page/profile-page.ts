import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firebase } from '../firebase';
import { MatCardModule } from '@angular/material/card';
import { WikiCard } from '../collection-page/collection-page';
import { FullCard } from '../full-card/full-card';

export interface Profile {
  username: string,
  currentUser: boolean,
  pfp: string | null,
  joined: Date,
  featured: any[]
}

@Component({
  selector: 'app-profile-page',
  imports: [MatCardModule, FullCard],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})

export class ProfilePage {
  firebase = inject(Firebase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  profile: Profile = {
    username: '---',
    currentUser: false,
    pfp: null,
    joined: new Date(),
    featured: []
  };

  selectedCard: WikiCard | undefined;
  selected = false;

  constructor() {
    // Access route parameters
    this.route.params.subscribe(params => {
      var username = params['username'] || '';
      this.loadProfile(username);
    });
  }

  async loadProfile(username: string) {
    var tmp = await this.firebase.loadProfile(username);
    if (tmp) {
      this.profile = tmp;
    }
  }

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }
}
