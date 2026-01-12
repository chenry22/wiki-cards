import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { Firebase } from '../firebase';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WikiCard } from '../collection-page/collection-page';
import { MatCardModule } from '@angular/material/card';
import { FullCard } from '../full-card/full-card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatButtonModule, FormsModule, MatInputModule, MatCheckboxModule],
  templateUrl: './binder-page.html',
  styleUrl: './binder-page.css',
})
export class BinderPage {
  firebase = inject(Firebase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  binderID = '';
  binders: WritableSignal<Array<Binder | null>> = signal([]);
  loading = true;

  leftPage: Array<any | null> = new Array(9).fill(null);
  rightPage: Array<any | null> = new Array(9).fill(null);
  pageNum = 0;

  selectedCard: WikiCard | undefined;
  selected = false;
  cards: any[] = [];

  private editing = false;
  newBinderName = '';
  newBinderColor = 'white';
  newBinderPrivacy = false;
  private cardsCopy: any[] = [];
  editedCards: Map<string, number> = new Map(); // card id -> new index.

  firstCard: any | null = null;

  binderReload = effect(() => {
    // when binder signal updates
    this.loadPage(this.pageNum);
  });

  showFullCard(card: WikiCard, left: boolean) {
    this.cards = left ? this.leftPage : this.rightPage;
    this.selectedCard = card;
    this.selected = true;
  }
  
  constructor() {
    // Access route parameters
    this.route.params.subscribe(params => {
      this.binderID = params['binder_id'] || '';
      this.loadBinder();
    });
  }

  async loadBinder() {
    this.binders.set([await this.firebase.loadBinder(this.binderID)]);
    this.loadPage(0);
    this.loading = false;
  }

  loadPage(pageNum: number) {
    this.pageNum = pageNum;
    this.leftPage.fill(null);
    this.rightPage.fill(null);
    this.binders()[0]?.cards.forEach((card) => {
      if (card.index >= pageNum * 9 && card.index < (pageNum + 1) * 9) {
        this.leftPage[card.index - pageNum * 9] = card;
      } else if (card.index >= (pageNum + 1) * 9 && card.index <= (pageNum + 2) * 9) {
        this.rightPage[card.index - (pageNum + 1) * 9] = card;
      } 
    })
  }

  pageHasCards(pageNum: number) {
    return this.binders()[0]?.cards.filter((card) => {
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
    return this.firebase.username() === this.binders()[0]?.username;
  }

  isEditing() {
    return this.editing;
  }
  beginEditing() {
    this.firstCard = null;
    this.editing = true;
    this.newBinderName = this.binders()[0]?.title ?? '';
    this.newBinderColor = this.binders()[0]?.color ?? 'white';
    this.newBinderPrivacy = this.binders()[0]?.private ?? false;
    this.cardsCopy = this.binders()[0]!.cards.map(x => Object.assign({}, x));
  }
  cancelEdit() {
    this.editing = false;
    this.editedCards.clear();
    this.binders()[0]!.cards = this.cardsCopy;
    this.loadPage(this.pageNum);
  }
  async saveEdit() {
    // commit  to firebase, if successful change local
    if (await this.firebase.editBinder(this.binderID, this.newBinderName, this.newBinderColor, this.newBinderPrivacy, this.editedCards)) {
      this.binders()[0]!.title = this.newBinderName;
      this.binders()[0]!.color = this.newBinderColor;
      this.binders()[0]!.private = this.newBinderPrivacy;
      this.editing = false;
      this.loadPage(this.pageNum);
    }
  }

  swapCard(card: any) {
    if (!this.editing || (this.firstCard?.index ?? -1) == card.index || this.binders()[0] === null) { return; }
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

      let arrFirstCard = this.binders()[0]!.cards.findIndex((card) => {
        return card.index == firstCardIndex;
      });
      let arrSecondCard = this.binders()[0]!.cards.findIndex((card) => {
        return card.index == secondCardIndex;
      });

      if (arrFirstCard > -1) {
        this.binders()[0]!.cards[arrFirstCard].index = secondCardIndex;
        this.editedCards.set(this.binders()[0]?.cards[arrFirstCard].id, secondCardIndex);
      }
      if (arrSecondCard > -1) {
        this.binders()[0]!.cards[arrSecondCard].index = firstCardIndex;
        this.editedCards.set(this.binders()[0]?.cards[arrSecondCard].id, firstCardIndex);
      }

      this.firstCard = null;
      this.loadPage(this.pageNum);
    }
  }

  async deleteBinder() {
    if (confirm("Are you sure you want to delete this binder? This action cannot be undone.")) {
      let err = await this.firebase.deleteBinder(this.binders()[0]!)
      if (err === undefined) {
        this.router.navigateByUrl('/collection')
      } else {
        alert(err);
      }
    }
  }
}
