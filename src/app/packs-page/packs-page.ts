import { Component, effect, ElementRef, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Firebase } from '../firebase';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-packs-page',
  imports: [MatDividerModule],
  templateUrl: './packs-page.html',
  styleUrl: './packs-page.css',
})
export class PacksPage implements OnInit {
  firebase = inject(Firebase);
  router = inject(Router);

  packs: any[] = [];
  loading = true;

  @ViewChild('packScroll') packContainer!: ElementRef;
  @ViewChildren('pack') packRefs!: QueryList<ElementRef>;
  activeIndex = 0;

  onScrollPacks() {
    console.log('scroll')
    const container = this.packContainer.nativeElement;
    const center = container.scrollLeft + container.offsetWidth / 2;

    let closest = 0;
    let minDistance = Infinity;

    this.packRefs.forEach((item, index) => {
      const el = item.nativeElement;
      const itemCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - itemCenter);

      if (dist < minDistance) {
        minDistance = dist;
        closest = index;
      }
    });

    this.activeIndex = closest;
  }

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload packs for the found user
    this.loadPacks();
  });

  async ngOnInit() {
    this.loadPacks();
  }

  async loadPacks() {
    if (this.firebase.username() != null) {
      var packData = await this.firebase.loadAvailablePacks();
      this.loading = false;
      this.packs = packData.map((pack) => {
        var data = pack.data();
        return {
          id: pack.id,
          cards: data["cards"],
          created: data["created"].toDate().toDateString()
        };
      });
    }
    this.loading = false;
  }

  redeemPack(id: string) {
    this.router.navigateByUrl('/pack/' + id);
  }


  // buying more packs...
  balance = 0;
  readonly oneCardPackCost = 30;
  readonly threeCardPackCost = 60;
  readonly fiveCardPackCost = 90;


  togglePackShop() {
    let shop = document.getElementById('pack-shop');
    if(shop?.classList.contains('hidden')) {
      shop.classList.remove('hidden');
    } else {
      shop?.classList.add('hidden');
    }
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
