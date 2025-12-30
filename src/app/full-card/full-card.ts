import { Component, effect, inject, input, model, ViewChild } from '@angular/core';
import { Firebase } from '../firebase';
import { MatCardModule } from '@angular/material/card';
import { Effect, WikiCard } from '../collection-page/collection-page';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-full-card',
  imports: [MatCardModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './full-card.html',
  styleUrl: './full-card.css',
})
export class FullCard {
  @ViewChild(MatMenuTrigger) matMenu: MatMenuTrigger = new MatMenuTrigger;
  
  firebase = inject(Firebase);

  shown = model<boolean>(false);
  card = model<WikiCard>();
  currUser = input(false);
  cards = model<WikiCard[]>();
  profilePage = input(false);
  desc = 'Loading...';


  constructor() {
    effect(() => {
      if (this.shown()) {
        this.showCard();
      }
    });
  }

  async showCard() {
    if (this.card() === undefined) { return; }
    this.desc = '';

    const params2 = {
        action: 'query',
        format: 'json',
        prop: 'extracts',
        exsentences: '20',
        exlimit: '1',
        titles: this.card()?.title ?? '',
        explaintext: '1',
        formatversion: '2'
      }
      var url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params2).toString()
      var rev = await (await fetch(url)).json();
      if (rev.query.pages[0].extract) {
        this.desc = rev.query.pages[0].extract.replaceAll('\n\n\n\n', '\n').replaceAll('\n\n\n', '\n').replaceAll('\n', '\n\n')
      } else {
        this.desc = "[ No description ]"
      }
  }

  hideCard() {
    this.shown.set(false);
  }

  showMenu() {
    this.matMenu.openMenu();
  }

  starCard() {
    var c = this.card();
    if (c) {
      this.card.set({ ...c, starred: true });
      this.firebase.starCard(c.id);
    }
  }
  unstarCard() {
    var c = this.card();
    if (c) {
      this.card.set({ ...c, starred: false });
      this.firebase.unstarCard(c.id);
    }
  }

  setFeatured() {
    var c = this.card();
    if (c === undefined) { return; }
    this.firebase.setFeaturedCard(c);
  }

  async removeFeatured() {
    var c = this.card();
    if (c === undefined) { return; }
    
    if (confirm("Are you sure you want to un-feature this card?") && await this.firebase.removeFeaturedCard(c)) {
      this.cards.set(
        this.cards()?.filter((card) => {
          return card.id !== this.card()?.id;
        })
      )
      this.shown.set(false);
    }
  }

  setProfilePicture() {
    var c = this.card();
    if (c === undefined) { return; }
    this.firebase.setProfilePicture(c.thumbnail);
  }

  cardSellValue() {
    var base = 0;
    switch(this.card()?.effect) {
      case Effect.red:
      case Effect.blue:
      case Effect.green:
        base = 10;
        break;
      case Effect.silver:
        base = 20;
        break;
      case Effect.gold:
        base = 30;
        break;
      case Effect.negative:
        base = 50;
        break;
      case Effect.holo:
        base = 100;
        break;
      default:
        break;
    }
    switch(this.card()?.rarity) {
      case 'common':
        return 5 + base;
      case 'uncommon':
        return 10 + base;
      case 'rare':
        return 25 + base;
      case 'epic':
        return 50 + base;
      case 'legendary':
        return 100 + base;
      default: 
        return 0;
    }
  }
  
  async sellCard() {
    var c = this.card();
    if (c === undefined) { return; }

    var value = this.cardSellValue();
    if (confirm("Are you sure you want to sell this card for " + value + " coins?") && await this.firebase.sellCard(c.id, value)) {
      this.cards.set(
        this.cards()?.filter((card) => {
          return card.id !== this.card()?.id;
        })
      )
      this.shown.set(false);
    }
  }
}
