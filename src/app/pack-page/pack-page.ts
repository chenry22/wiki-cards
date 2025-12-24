import { Component, effect, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Firebase } from '../firebase';

enum PackState {
  Sealed,
  Revealing,
  Summary
}

@Component({
  selector: 'app-pack-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pack-page.html',
  styleUrl: './pack-page.css',
})
export class PackPage  {
  firebase = inject(Firebase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public pages: any[] = []; // cards

  PackState = PackState;
  state: PackState = PackState.Sealed;
  packSize = -1;
  packID = '';

  swipeLocked = false;
  currIndex = 0;
  startX = 0;
  currentX = 0;
  rotationX = 0;
  dragging = false;

  wheelAccum = 0;
  wheelLocked = false;

  WHEEL_THRESHOLD = 80;
  WHEEL_COOLDOWN = 400;

  constructor() {
    // Access route parameters
    this.route.params.subscribe(params => {
      this.packID = params['pack_id'] || '';
      this.loadPack();
    });
  }

  private reloadEffect = effect(() => {
    // when username signal updates, this will re-check the pack
    this.loadPack();
  });

  async loadPack() {
    if (this.firebase.username() != null) {
      this.packSize = await this.firebase.loadPackSize(this.packID);
    }
  }

  async openPack() {
    this.pages = [];
    this.state = PackState.Revealing;

    for(var i = 0; i < this.packSize; i++) {
      var rarity;
      var chance = Math.random();
      if (chance < 0.38) {
        rarity = "common";
      } else if (chance < 0.66) {
        rarity = "uncommon"
      } else if (chance < 0.84) {
        rarity = "rare"
      } else if (chance < 0.94) {
        rarity = "epic"
      } else {
        rarity = "legendary"
      }
     

      var page = await this.getRandomWikiPages(1, rarity);
      page[0].rarity = rarity;
      this.pages.push(page[0]);
    }

    // once pack is fully open, send data to firebase
    this.firebase.openPack(this.packID, this.pages);
  }

  async starCard() {
    this.pages[this.currIndex].starred = true;
    this.firebase.starCard(this.packID + this.currIndex);
  }
  async unstarCard() {
    this.pages[this.currIndex].starred = false;
    this.firebase.unstarCard(this.packID + this.currIndex);
  }

  showSummary() {
    this.state = PackState.Summary;
  }

  async claimPack() {
    // go back to timer? basically just any cleanup and finish
    this.router.navigateByUrl('');
  }

  commitSwipe(direction: 'left' | 'right') {
    if (this.swipeLocked) return;
    this.swipeLocked = true;

    var movement = 140
    var rotate = 4
    this.currentX = direction === 'right' ? -movement : movement;
    this.rotationX = direction === 'right' ? -rotate : rotate;

    document.getElementById('card-content')?.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      this.currIndex += direction === 'left' ? -1 : 1;
      this.currentX = 0;
      this.rotationX = 0;
      this.swipeLocked = false;
    }, 250);
  }

  onPointerDown(event: PointerEvent) {
    if (this.swipeLocked) return;

    this.dragging = true;
    this.startX = event.clientX;
    this.currentX = 0;

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }
  onPointerMove(event: PointerEvent) {
    if (!this.dragging) { return; }
    this.currentX = Math.max(Math.min(event.clientX - this.startX, 200), -200);
  }
  onPointerUp(event: PointerEvent) {
    if (!this.dragging || this.swipeLocked) return;

    this.dragging = false;
    const distance = this.currentX;

    if (Math.abs(distance) > 120) {
      this.commitSwipe(distance < 0 ? 'right' : 'left');
    } else {
      this.currentX = 0;
    }
  }



  // wikipedia api stuff
  async getRandomWikiPages(count=5, rarity="common") {
    var minsize, maxsize;
    switch(rarity) {
      case "common":
        minsize = "500"
        maxsize = "2500"
        break;
      case "uncommon":
        minsize = "2500"
        maxsize = "8000"
        break;
      case "rare":
        minsize = "8000"
        maxsize = "20000"
        break;
      case "epic":
        minsize = "20000"
        maxsize = "100000"
        break;
      case "legendary":
        minsize = "100000"
        maxsize= "100000000"
        break;
      default:
        return []; // invalid, don't load
    }

    // get random articles from api 
    var params = {
      action: "query",
      format: "json",
      list: "random",
      rnlimit: String(count),
      rnnamespace: "0", // main, so only real articles
      rnminsize: minsize, // min number of bytes in each article
      rnmaxsize: maxsize
    };
    var url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params).toString();;

    const response = await (await fetch(url)).json();
    var pages = response.query.random;
    for (var i in pages) {
      pages[i].class = "card " + rarity
      // get data for page
      const params = {
        action: "opensearch",
        search: pages[i].title,
        limit: "1",
        namespace: "0",
        format: "json",
      };
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params).toString();
      const r = await (await fetch(url)).json();
      pages[i].link = String(r[3][0]);


      // get page image
      const params3 = {
        action: 'query',
        titles: pages[i].title,
        prop: 'pageimages',
        pilicense: 'any',
        pithumbsize: '400',
        format: 'json',
        formatversion: '2'
      }
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params3).toString()
      var rev = await (await fetch(url)).json();
      if (rev.query.pages[0] && rev.query.pages[0].thumbnail) {
        pages[i].thumbnail = rev.query.pages[0].thumbnail.source
      } else {
        pages[i].thumbnail = 'default-card.png';
      }


      // get page description/preview
      const params2 = {
        action: 'query',
        format: 'json',
        prop: 'extracts',
        exsentences: '8',
        exlimit: '1',
        titles: pages[i].title, // String(r[3][0]).split("/")[String(r[3][0]).split("/").length - 1],
        explaintext: '1',
        formatversion: '2'
      }
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params2).toString()
      var rev = await (await fetch(url)).json();
      var maxLen = 600
      if (rev.query.pages[0].extract) {
        if (String(rev.query.pages[0].extract).length > maxLen) {
          pages[i].desc = String(rev.query.pages[0].extract).substring(0, maxLen - 3) + "..."
        } else {
          pages[i].desc = String(rev.query.pages[0].extract)
        }
      } else {
        pages[i].desc = "[ No description ]"
      }
    }
    console.log(pages);
    return pages;
  }

  getPageLink(page: any) {
    return page?.link;
  }
}