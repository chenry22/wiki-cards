import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { Profile } from '../profile-page/profile-page';
import { WikiCard } from '../collection-page/collection-page';
import { Firebase } from '../firebase';

@Component({
  selector: 'app-community-page',
  imports: [RouterLink, MatDivider, MatButtonModule],
  templateUrl: './community-page.html',
  styleUrl: './community-page.css',
})
export class CommunityPage {
  firebase = inject(Firebase);
  
  profiles: Profile[] = [];

  selectedCard: WikiCard | undefined;
  selected = false;

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }

  constructor() {
    this.loadProfiles();
  }

  async loadProfiles() {
    this.profiles = await this.firebase.loadRandomProfiles(10);
  }
}
