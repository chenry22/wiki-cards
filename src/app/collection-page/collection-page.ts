import { Component, effect, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-collection-page',
  imports: [MatCardModule, MatDividerModule, MatButtonToggleModule, MatButtonModule, MatIconModule],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css',
})
export class CollectionPage {
  firebase = inject(Firebase);
  cards: any[] = [];

  loading = true;
  lastDoc: DocumentSnapshot | null = null;
  selectedSort = "Star";

  moreCards = true;
  private loadLimit = 20;

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload packs for the found user
    this.cards = [];
    this.lastDoc = null;
    this.loadCards();
  });

  async loadCards() {
    this.loading = true;
    if (this.firebase.username() != null) {
      var docs;
      if (this.selectedSort === "Rarity") {
        docs = await this.firebase.loadCollection(this.lastDoc, this.loadLimit);
      } else if (this.selectedSort === "Date") {
        docs = await this.firebase.loadCollectionByDate(this.lastDoc, this.loadLimit);
      } else {
        docs = await this.firebase.loadCollectionByStar(this.lastDoc, this.loadLimit);
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
          title: data['title'],
          link: data['link'],
          thumbnail: data['thumbnail'],
          created: data['created'].toDate().toDateString(),
          starred: data['starred']
        });
      });
      this.loading = false;
    }
  }

  async changeSort(v: string ) {
    this.selectedSort = v;
    this.cards = [];
    this.lastDoc = null;
    this.loadCards();
  }

  async starCard(card: any) {
    card.starred = true;
    this.firebase.starCard(card.id);
  }
  async unstarCard(card: any) {
    card.starred = false;
    this.firebase.unstarCard(card.id);
  }
}
