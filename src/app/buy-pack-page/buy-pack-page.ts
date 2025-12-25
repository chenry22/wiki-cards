import { Component, effect, inject, OnInit } from '@angular/core';
import { Firebase } from '../firebase';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-buy-pack-page',
  imports: [RouterLink],
  templateUrl: './buy-pack-page.html',
  styleUrl: './buy-pack-page.css',
})
export class BuyPackPage implements OnInit {
  firebase = inject(Firebase);

  balance = 0;
  readonly oneCardPackCost = 20;
  readonly threeCardPackCost = 50;
  readonly fiveCardPackCost = 70;

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload balance for user
    console.log("reload");
    this.loadBalance();
  });

  ngOnInit() {
    this.loadBalance();
  }

  async loadBalance() {
    if (this.firebase.username() !== null) {
      this.balance = await this.firebase.loadBalance();
    }
  }

  async buyOneCardPack() {
    if (confirm("Buy pack of 1?") && await this.firebase.buyPack(1, this.oneCardPackCost)) {
      this.balance -= this.oneCardPackCost;
    }
  }
  async buyThreeCardPack() {
    if (confirm("Buy pack of 3?") && await this.firebase.buyPack(3, this.threeCardPackCost)) {
      this.balance -= this.threeCardPackCost;
    }
  }
  async buyFiveCardPack() {
    if (confirm("Buy pack of 5?") && await this.firebase.buyPack(5, this.fiveCardPackCost)) {
      this.balance -= this.fiveCardPackCost;
    }
  }
}
