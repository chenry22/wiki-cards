import { Component, effect, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Profile } from '../profile-page/profile-page';
import { Effect, WikiCard } from '../collection-page/collection-page';
import { Firebase } from '../firebase';
import { FullCard } from '../full-card/full-card';
import { Binder } from '../binder-page/binder-page';
import { DocumentSnapshot } from '@angular/fire/firestore';

const CARD_LOAD_COUNT = 30;

@Component({
  selector: 'app-community-page',
  imports: [RouterLink, MatDivider, MatButtonModule, FullCard],
  templateUrl: './community-page.html',
  styleUrl: './community-page.css',
})
export class CommunityPage {
  firebase = inject(Firebase);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  profiles: Profile[] = [];
  cards: any[] = [];
  binders: Binder[] = [];

  tab = 'users';

  lastCard: DocumentSnapshot | null = null;

  selectedCard: WikiCard | undefined;
  selected = false;

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }

  showTab(tab: string) {
    if (this.tab !== tab) {
      this.tab = tab;
      this.location.replaceState(`/community/${tab === 'users' ? '' : tab}`);

      switch(tab) {
        case 'users':
          if (this.profiles.length === 0) {
            this.loadProfiles();
          }
          break;
        case 'binders':
          if (this.binders.length === 0) {
            this.loadBinders();
          }
          break;
        case 'packs':
          if (this.cards.length === 0) {
            this.loadRecentCards();
          }
          break;
      }
    }
  }

  constructor() {
    this.route.url.subscribe(url => {
      let last = url.pop();
      if (!last) { return; }
      if (['users', 'binders', 'packs'].includes(last.path)) {
        this.showTab(last.path);
      } else {
        this.loadProfiles();
      }
    })
  }

  async loadProfiles() {
    this.profiles = await this.firebase.loadRandomProfiles(10);
  }

  async loadBinders() {
    this.binders = await this.firebase.loadRecentBinders(10);
  }

  async loadRecentCards() {
    let snapshotDocs = await this.firebase.loadRecentCards(CARD_LOAD_COUNT, this.lastCard);
    if (snapshotDocs.length === CARD_LOAD_COUNT) {
      this.lastCard = snapshotDocs[snapshotDocs.length - 1];
    } else {
      this.lastCard = null;
    }

    let snapshotToCards = snapshotDocs.map((doc) => {
      let data = doc.data();
      return {
        id: doc.id,
        username: data['username'],
        wiki_id: data['wiki_id'],

        title: data['title'],
        thumbnail: data['thumbnail'],
        link: data['link'],
        rarity: this.firebase.rarityNumberToString(data['rarity']),
        effect: data['effect'],
        created: data['created'].toDate(),
        originalOwner: data['originalOwner'] ?? data['username']
      };
    })
    let cards: any[] = [];
    snapshotToCards.forEach((card) => {
      if (cards.length === 0 || Math.abs(cards[cards.length - 1][0].created.getTime() - card.created.getTime()) > 100) {
        cards.push([card])
      } else {
        cards[cards.length - 1].push(card)
      }
    })
    
    this.cards = this.cards.concat(cards);
    this.cards.forEach((cardArr) => {
      cardArr.forEach((c: any) => {
        c.created = c.created.toDateString();
      })
    })
  }

  // Source - https://stackoverflow.com/a
  // Posted by Sky Sanders, modified by community. See post 'Timeline' for change history
  // Retrieved 2025-12-29, License - CC BY-SA 4.0
  timeSince(date: string) {
    var seconds = Math.floor((Date.now() - Date.parse(date)) / 1000);
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
