import { Component, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiCard } from '../collection-page/collection-page';
import { MatCardModule } from '@angular/material/card';
import { FullCard } from '../full-card/full-card';
import { MatButtonModule } from '@angular/material/button';

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
  imports: [MatCardModule, FullCard, RouterLink, MatButtonModule],
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
      if (card.index >= pageNum * 9 && card.index <= (pageNum + 1) * 9) {
        this.leftPage[card.index - pageNum * 9] = card;
      } else if (card.index >= (pageNum + 1) * 9 && card.index <= (pageNum + 2) * 9) {
        this.rightPage[card.index - (pageNum + 1) * 9] = card;
      } 
    })
  }

  pageHasCards(pageNum: number) {
    return this.binder?.cards.filter((card) => {
      if (card.index >= pageNum * 9 && card.index <= (pageNum + 1) * 9) {
        return true;
      }
      return false;
    })?.length ?? 0 > 0;
  }

  pageChangeLeft(i: number) {
    this.loadPage(Math.min(0, this.pageNum - i))
  }
  pageChangeRight(i: number) {
    this.loadPage(this.pageNum + i)
  }

  currUser() {
    return this.firebase.username() === this.binder?.username;
  }
}
