import { Component, effect, inject, input } from '@angular/core';
import { Firebase } from '../firebase';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FullCard } from '../full-card/full-card';
import { Binder } from '../binder-page/binder-page';
import { BinderCreate } from '../binder-create/binder-create';
import { RouterLink } from '@angular/router';

export interface WikiCard {
  id: string,
  rarity: string,
  wiki_id: string,
  title: string,
  link: string,
  thumbnail: string,
  created: string,
  starred: boolean,
  effect: Effect,
  username: string,
  originalOwner: string,
}

export enum Effect {
  none = 'none', red = 'red', blue = 'blue', green = 'green',
  silver = 'silver', gold = 'gold', 
  negative = 'negative', holo = 'holo'
}

@Component({
  selector: 'app-collection-page',
  imports: [MatCardModule, MatDividerModule, MatButtonToggleModule, 
    MatButtonModule, MatIconModule, FullCard, BinderCreate, RouterLink],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css',
})
export class CollectionPage {
  firebase = inject(Firebase);
  cards: WikiCard[] = [];
  binders: Binder[] = [];

  username = input<string>('');
  currentUser = input<boolean>(false);

  loading = true;
  lastDoc: DocumentSnapshot | null = null;
  selectedSort = "Star";

  moreCards = true;
  private loadLimit = 25;

  selectedCard: WikiCard | undefined;
  selected = false;
  creatingBinder = false;

  showFullCard(card: WikiCard) {
    console.log(this.cards)
    this.selectedCard = card;
    this.selected = true;
  }

  showBinderCreate() {
    this.creatingBinder = true;
  }

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload packs for the found user
    this.cards = [];
    this.lastDoc = null;
    this.loadCards();
    this.loadBinders();
  });

  async loadCards() {
    this.loading = true;

    var docs;
    if (this.selectedSort === "Rarity") {
      docs = await this.firebase.loadCollection(this.username(), this.lastDoc, this.loadLimit);
    } else if (this.selectedSort === "Date") {
      docs = await this.firebase.loadCollectionByDate(this.username(), this.lastDoc, this.loadLimit);
    } else if (this.selectedSort === "Effect") {
      docs = await this.firebase.loadCollectionByEffect(this.username(), this.lastDoc, this.loadLimit);
    } else {
      docs = await this.firebase.loadCollectionByStar(this.username(), this.lastDoc, this.loadLimit);
    }
    this.moreCards = docs.length >= this.loadLimit;
    this.lastDoc = docs[docs.length - 1];

    docs.forEach((card) => {
      var data = card.data();
      var r = data['rarity'];
      if (r == 0) {
        r = "common"
      } else if (r == 1) {
        r = "uncommon";
      } else if (r == 2) {
        r = "rare";
      } else if (r == 3) {
        r = "epic"
      } else if (r == 4) {
        r = "legendary"
      }
      this.cards.push({
        id: card.id,
        rarity: r,
        wiki_id: data['id'],
        title: data['title'],
        link: data['link'],
        thumbnail: data['thumbnail'],
        created: data['created'].toDate().toDateString(),
        starred: data['starred'],
        effect: data['effect'] ?? Effect.none,
        username: data['username'],
        originalOwner: data['originalOwner'] ?? data['username']
      });
    });
    this.loading = false;
  }

  async changeSort(v: string ) {
    this.selectedSort = v;
    this.cards = [];
    this.lastDoc = null;
    this.loadCards();
  }

  async starCard(card: any, e: MouseEvent) {
    e.stopPropagation();
    if(!this.currentUser()) { return; }
    card.starred = true;
    this.firebase.starCard(card.id);
  }
  async unstarCard(card: any, e: MouseEvent) {
    e.stopPropagation();
    if(!this.currentUser()) { return; }
    card.starred = false;
    this.firebase.unstarCard(card.id);
  }

  async loadBinders() {
    this.binders = await this.firebase.loadUserBinders(this.username());
  }
}
