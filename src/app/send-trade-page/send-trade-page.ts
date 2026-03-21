import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WikiCard } from '../collection-page/collection-page';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { Firebase } from '../firebase';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FullCard } from '../full-card/full-card';

@Component({
  selector: 'app-send-trade-page',
  imports: [MatDividerModule, RouterLink, MatIconModule, FullCard],
  templateUrl: './send-trade-page.html',
  styleUrl: './send-trade-page.css',
})
export class SendTradePage {
  firebase = inject(Firebase);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  otherUser = '';

  sending: WikiCard[] = [];
  receiving: WikiCard[] = [];

  yourInv: WikiCard[] = [];
  private yourLastDoc: DocumentSnapshot| null = null;
  moreYour = true;
  loadingYour = false;

  otherInv: WikiCard[] = [];
  private otherLastDoc: DocumentSnapshot | null = null;
  moreOther = true;
  loadingOther = false;
  
  private loadLength = 25;

  // show full
  selectedCard: WikiCard | undefined;
  selected = false;

  constructor() {
    let s = this.router.currentNavigation()?.extras.state;
    if (s && s['card'] !== undefined) {
      // add one card to receiving
      this.receiving.push(s['card']);
    }

    this.route.params.subscribe(params => {
      this.otherUser = params['username'];
      this.loadOtherUserCards();
    });
  }

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload for user
    this.loadCurrUserCards();
  });

  toggleSendingCard(event: any, card: WikiCard) {
    let index = this.sending.findIndex(c => c.id === card.id);
    if (index >= 0) {
      this.sending.splice(index, 1);
    } else {
      this.sending.push(card);
    }
    event.stopPropagation();
  }
  isSending(card: WikiCard) {
    return this.sending.find(c => c.id === card.id) !== undefined;
  }

  toggleReceivingCard(event: any, card: WikiCard) {
    let index = this.receiving.findIndex(c => c.id === card.id);
    if (index >= 0) {
      this.receiving.splice(index, 1);
    } else {
      this.receiving.push(card);
    }
    event.stopPropagation();
  }
  isReceiving(card: WikiCard) {
    return this.receiving.find(c => c.id === card.id) !== undefined;
  }

  showFullCard(event: any, card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
    event.stopPropagation();
  }

  async loadCurrUserCards() {
    let username = this.firebase.username();
    if (!username) { return; }

    this.loadingYour = true;
    let docs = await this.firebase.loadCollection(username, this.yourLastDoc, this.loadLength);
    if (docs) {
      let cards = docs.map(doc => {
        let data = doc.data();
        return {
          id: doc.id,
          wiki_id: data['id'],
          starred: data['starred'],
          username: data['username'],

          title: data['title'],
          thumbnail: data['thumbnail'],
          link: data['link'],
          rarity: this.firebase.rarityNumberToString(data['rarity']),
          effect: data['effect'] ?? 'none',
          created: data['created'].toDate().toDateString(),
          originalOwner: data['originalOwner'] ?? data['username']
        };
      });
      this.yourInv.push(...cards);
      this.yourLastDoc = docs[docs.length - 1];
      this.moreYour = docs.length === this.loadLength;
      this.loadingYour = false;
    }
  }

  async loadOtherUserCards() {
    this.loadingOther = true;

    let docs = await this.firebase.loadCollection(this.otherUser, this.otherLastDoc, this.loadLength);
    if (docs) {
      let cards = docs.map(doc => {
        let data = doc.data();
        return {
          id: doc.id,
          wiki_id: data['id'],
          starred: data['starred'],
          username: data['username'],

          title: data['title'],
          thumbnail: data['thumbnail'],
          link: data['link'],
          rarity: this.firebase.rarityNumberToString(data['rarity']),
          effect: data['effect'] ?? 'none',
          created: data['created'].toDate().toDateString(),
          originalOwner: data['originalOwner'] ?? data['username']
        };
      });

      this.otherInv.push(...cards);
      this.otherLastDoc = docs[docs.length - 1];
      this.moreOther = docs.length === this.loadLength;
      this.loadingOther = false;
    }
  }

  async sendTrade() {
    if (this.receiving.length === 0 && this.sending.length === 0) {
      alert("At least 1 card must be sent or received in a trade.");
    } else {
      if ((this.receiving.length === 0 || this.sending.length === 0) 
        && !confirm("One side is not receiving any cards in this trade. Send anyways?")) {
        return;
      }
      let trade = await this.firebase.sendTradeRequest(this.otherUser, this.sending, this.receiving);
      this.router.navigateByUrl('trades');
    }
  }
}
