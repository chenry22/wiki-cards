import { Component, effect, inject } from '@angular/core';
import { FullCard } from '../full-card/full-card';
import { WikiCard } from '../collection-page/collection-page';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { Firebase } from '../firebase';
import { DocumentSnapshot } from '@angular/fire/firestore';

export interface Trade {
  id: string,
  sentBy: string,
  sentTo: string,
  sent: string,
  cardsSending: WikiCard[],
  cardsReceiving: WikiCard[];
}

@Component({
  selector: 'app-trades-page',
  imports: [FullCard, MatDividerModule, RouterLink],
  templateUrl: './trades-page.html',
  styleUrl: './trades-page.css',
})
export class TradesPage {
  firebase = inject(Firebase);

  incomingTrades: Trade[] = [];
  outgoingTrades: Trade[] = [];

  loadLimit = 10;
  lastIncoming: DocumentSnapshot | null = null;
  moreIncoming = true;
  lastOutgoing : DocumentSnapshot | null = null;
  moreOutgoing = true;

  // show full
  selectedCard: WikiCard | undefined;
  selected = false;

  constructor() {
    this.loadIncomingTrades();
    this.loadOutgoingTrade();
  }

  private reloadEffect = effect(() => {
    // when username signal update (login), this will reload for user
    this.loadIncomingTrades();
    this.loadOutgoingTrade();
  });

  async loadIncomingTrades() {
    if (!this.moreIncoming) { return; }
    let trades = await this.firebase.loadIncomingTrades(this.loadLimit, this.lastIncoming);
    if (!trades) { return; }
    console.log(trades.docs);

    this.incomingTrades = trades.docs.map(trade => {
      let data = trade.data();
      return {
        id: trade.id,
        sentBy: data['sentBy'],
        sentTo: data['sentTo'],
        sent: data['sent'].toDate().toDateString(),
        cardsReceiving: data['cardsReceiving'].map((card: any) => {
          return {
            id: card.id,
            rarity: card.rarity,
            wiki_id: card.wiki_id,
            title: card.title,
            link: card.link,
            thumbnail: card.thumbnail,
            created: card.created,
            effect: card.effect,
          };
        }),
        cardsSending: data['cardsSending'].map((card: any) => {
          return {
            id: card.id,
            rarity: card.rarity,
            wiki_id: card.wiki_id,
            title: card.title,
            link: card.link,
            thumbnail: card.thumbnail,
            created: card.created,
            effect: card.effect,
          };
        }),
      };
    });
    this.lastIncoming = trades.docs[trades.docs.length - 1];
    this.moreIncoming = trades.docs.length === this.loadLimit;
  }
  async loadOutgoingTrade() {
    if (!this.moreOutgoing) { return; }
    let trades = await this.firebase.loadOutgoingTrades(this.loadLimit, this.lastIncoming);
    if (!trades) { return; }
    console.log(trades.docs);

    this.outgoingTrades = trades.docs.map(trade => {
      let data = trade.data();
      return {
        id: trade.id,
        sentBy: data['sentBy'],
        sentTo: data['sentTo'],
        sent: data['sent'].toDate().toDateString(),
        cardsReceiving: data['cardsReceiving'].map((card: any) => {
          return {
            id: card.id,
            rarity: card.rarity,
            wiki_id: card?.wiki_id,
            title: card.title,
            link: card.link,
            thumbnail: card.thumbnail,
            created: card.created,
            effect: card.effect,
          };
        }),
        cardsSending: data['cardsSending'].map((card: any) => {
          return {
            id: card.id,
            rarity: card.rarity,
            wiki_id: card?.wiki_id,
            title: card.title,
            link: card.link,
            thumbnail: card.thumbnail,
            created: card.created,
            effect: card.effect,
          };
        }),
      };
    });
    this.lastOutgoing = trades.docs[trades.docs.length - 1];
    this.moreOutgoing = trades.docs.length === this.loadLimit;
  }

  async acceptTrade(trade: Trade) {
    if (confirm("Accept this trade? You will send away " + trade.cardsReceiving.length + " cards and get back " + trade.cardsSending.length + ".") 
      && await this.firebase.acceptTradeRequest(trade)
    ) {
      this.incomingTrades = this.incomingTrades.filter(card => {
        card.id !== trade.id;
      });
    }
  }

  async rejectTrade(trade: Trade) {
    if (await this.firebase.rejectTradeRequest(trade)) {
      this.incomingTrades = this.incomingTrades.filter(t1 => {
        return t1.id !== trade.id;
      });
    }
  }

  async cancelTrade(trade: Trade) {
    if (confirm("Cancel this trade?") && await this.firebase.rejectTradeRequest(trade)) {
      this.outgoingTrades = this.outgoingTrades.filter(t1 => {
        return t1.id !== trade.id;
      });
    }
  }

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
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
