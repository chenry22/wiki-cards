import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { Profile } from '../profile-page/profile-page';
import { Effect, WikiCard } from '../collection-page/collection-page';
import { Firebase } from '../firebase';
import { FullCard } from '../full-card/full-card';

@Component({
  selector: 'app-community-page',
  imports: [RouterLink, MatDivider, MatButtonModule, FullCard],
  templateUrl: './community-page.html',
  styleUrl: './community-page.css',
})
export class CommunityPage {
  firebase = inject(Firebase);
  
  profiles: Profile[] = [];
  cards: any[] = [];

  selectedCard: WikiCard | undefined;
  selected = false;

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }

  constructor() {
    this.loadProfiles();
    this.loadRecentCards();
  }

  async loadProfiles() {
    this.profiles = await this.firebase.loadRandomProfiles(10);
  }

  async loadRecentCards() {
    let allCards = await this.firebase.loadRecentCards(20);
    let cards: any[] = [];
    allCards.forEach((card) => {
      if (cards.length === 0 || Math.abs(cards[cards.length - 1][0].created.getTime() - card.created.getTime()) > 100) {
        cards.push([card])
      } else {
        cards[cards.length - 1].push(card)
      }
    })
    this.cards = cards;
  }

  // Source - https://stackoverflow.com/a
  // Posted by Sky Sanders, modified by community. See post 'Timeline' for change history
  // Retrieved 2025-12-29, License - CC BY-SA 4.0
  timeSince(date: Date) {
    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    var interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " month" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " day" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hour" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minute" + (Math.floor(interval) > 1 ? "s" : "");
    }
    return Math.floor(seconds) + " second" + (Math.floor(interval) > 1 ? "s" : "");
  }
}
