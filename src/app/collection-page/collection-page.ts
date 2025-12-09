import { Component, effect, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-collection-page',
  imports: [MatCardModule, MatDividerModule],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css',
})
export class CollectionPage {
  firebase = inject(Firebase);
  cards: any[] = [];

  lastDoc: DocumentSnapshot | null = null;

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload packs for the found user
    this.loadCards();
  });

  async loadCards() {
    if (this.firebase.username() != null) {
      var docs = await this.firebase.loadCollection(this.lastDoc, 10);
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
          thumbnail: data['thumbnail']
        });
      });
      console.log(this.cards);
    }
  }
}
