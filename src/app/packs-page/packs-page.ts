import { Component, effect, inject, OnInit } from '@angular/core';
import { Firebase } from '../firebase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-packs-page',
  imports: [],
  templateUrl: './packs-page.html',
  styleUrl: './packs-page.css',
})
export class PacksPage implements OnInit {
  firebase = inject(Firebase);
  router = inject(Router);

  packs: any[] = [];
  loading = true;

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
  }

  redeemPack(id: string) {
    this.router.navigateByUrl('/pack/' + id);
  }
}
