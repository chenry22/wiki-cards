import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firebase } from '../firebase';
import { MatCardModule } from '@angular/material/card';
import { Effect, WikiCard } from '../collection-page/collection-page';
import { FullCard } from '../full-card/full-card';

export interface Profile {
  username: string,
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
    pfp: null,
    joined: new Date(),
    featured: []
  };

  currentUser = false;

  selectedCard: WikiCard | undefined;
  selected = false;

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload balance for user
    console.log("reload");
    this.currentUser = this.firebase.username() === this.profile.username;
  });

  constructor() {
    // Access route parameters
    this.route.params.subscribe(params => {
      var username = params['username'] || '';
      this.profile.username = username;
      this.loadProfile(username);
    });
  }

  async loadProfile(username: string) {
    var tmp = await this.firebase.loadProfile(username);
    if (tmp) {
      this.currentUser = this.firebase.username() === username;
      this.profile = tmp;
    }
  }

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }
}
