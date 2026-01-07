import { Component, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiCard } from '../collection-page/collection-page';
import { MatCardModule } from '@angular/material/card';
import { FullCard } from '../full-card/full-card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

export interface Binder {
  id: string
  lastUpdated: Date,
  private: boolean,
  title: string,
  color: string,
  username: string
  cards: any[]
}

@Component({
  selector: 'app-binder-page',
  imports: [MatCardModule, FullCard, RouterLink, 
    MatButtonModule, FormsModule, MatInputModule],
  templateUrl: './binder-page.html',
  styleUrl: './binder-page.css',
})
export class BinderPage {
  firebase = inject(Firebase);
  private route = inject(ActivatedRoute);
  
  binderID = '';
  binder: Binder | null = null;
  loading = true;

  leftPage: Array<any | null> = new Array(9).fill(null);
  rightPage: Array<any | null> = new Array(9).fill(null);
  pageNum = 0;

  selectedCard: WikiCard | undefined;
  selected = false;
  cards: any[] = [];

  private editing = false;
  newBinderName = '';
  private cardsCopy: any[] = [];
  editedCards: Map<string, number> = new Map(); // card id -> new index.

  firstCard: any | null = null;

  showFullCard(card: WikiCard, left: boolean) {
    this.cards = left ? this.leftPage : this.rightPage;
    this.selectedCard = card;
    this.selected = true;
  }
  
  constructor() {
    console.log('binder')
    // Access route parameters
    this.route.params.subscribe(params => {
      this.binderID = params['binder_id'] || '';
      this.loadBinder();
    });
  }

  async loadBinder() {
    this.binder = await this.firebase.loadBinder(this.binderID);
    this.loadPage(0);
    this.loading = false;
  }

  loadPage(pageNum: number) {
    this.pageNum = pageNum;
    this.leftPage.fill(null);
    this.rightPage.fill(null);
    this.binder?.cards.forEach((card) => {
      if (card.index >= pageNum * 9 && card.index < (pageNum + 1) * 9) {
        this.leftPage[card.index - pageNum * 9] = card;
      } else if (card.index >= (pageNum + 1) * 9 && card.index <= (pageNum + 2) * 9) {
        this.rightPage[card.index - (pageNum + 1) * 9] = card;
      } 
    })
  }

  pageHasCards(pageNum: number) {
    return this.binder?.cards.filter((card) => {
      if (card.index >= pageNum * 9) {
        return true;
      }
      return false;
    })?.length ?? 0 > 0;
  }

  pageChangeLeft(i: number) {
    this.loadPage(Math.max(0, this.pageNum - i))
  }
  pageChangeRight(i: number) {
    this.loadPage(this.pageNum + i)
  }

  currUser() {
    return this.firebase.username() === this.binder?.username;
  }

  isEditing() {
    return this.editing;
  }
  beginEditing() {
    this.firstCard = null;
    this.editing = true;
    this.newBinderName = this.binder?.title ?? '';
    this.cardsCopy = this.binder!.cards.map(x => Object.assign({}, x));
  }
  cancelEdit() {
    this.editing = false;
    this.newBinderName = this.binder?.title ?? '';
    this.editedCards.clear();
    this.binder!.cards = this.cardsCopy;
    this.loadPage(this.pageNum);
  }
  async saveEdit() {
    // commit  to firebase, if successful change local
    if (await this.firebase.editBinder(this.binderID, this.newBinderName, this.editedCards)) {
      this.binder!.title = this.newBinderName;
      this.editing = false;
      this.loadPage(this.pageNum);
    }
  }

  swapCard(card: any) {
    if (!this.editing || (this.firstCard?.index ?? -1) == card.index || this.binder === null) { return; }
    if (this.firstCard == null) {
      // set up first swap
      this.firstCard = card;
      if (card.id == undefined) {
        this.firstCard.index += this.pageNum * 9;
      }
      
    } else {
      let index = card.index;
      if (card.id == undefined) {
        index += this.pageNum * 9;
      }
      let firstCardIndex = this.firstCard.index;
      let secondCardIndex = index;

      console.log(firstCardIndex, secondCardIndex);

      let arrFirstCard = this.binder.cards.findIndex((card) => {
        return card.index == firstCardIndex;
      });
      let arrSecondCard = this.binder.cards.findIndex((card) => {
        return card.index == secondCardIndex;
      });

      if (arrFirstCard > -1) {
        this.binder.cards[arrFirstCard].index = secondCardIndex;
        this.editedCards.set(this.binder.cards[arrFirstCard].id, secondCardIndex);
      }
      if (arrSecondCard > -1) {
        this.binder.cards[arrSecondCard].index = firstCardIndex;
        this.editedCards.set(this.binder.cards[arrSecondCard].id, firstCardIndex);
      }

      this.firstCard = null;
      this.loadPage(this.pageNum);
    }
  }
}
