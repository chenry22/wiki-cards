import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

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
export class PackPage {
  public pages: any[] = []; // cards

  PackState = PackState;
  state: PackState = PackState.Sealed;
  packSize = 6;

  swipeLocked = false;
  currIndex = 0;
  currentX = 0;

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
      this.pages.push(page[0]);
    }
  }

  async claimPack() {
    // send signal to firebase with cards
  }

  commitSwipe(direction: 'left' | 'right') {
    if (this.swipeLocked) return;
    this.swipeLocked = true;

    // Animate card off-screen
    this.currentX = direction === 'right' ? 1000 : -1000;

    setTimeout(() => {
      this.currIndex += direction === 'left' ? -1 : 1;
      this.currentX = 0;
      this.swipeLocked = false;
    }, 250);
  }



  // wikipedia api stuff
  async getRandomWikiPages(count=5, rarity="common") {
    var minsize, maxsize;
    switch(rarity) {
      case "common":
        minsize = "500"
        maxsize = "1000"
        break;
      case "uncommon":
        minsize = "1000"
        maxsize = "5000"
        break;
      case "rare":
        minsize = "5000"
        maxsize = "20000"
        break;
      case "epic":
        minsize = "20000"
        maxsize = "100000"
        break;
      case "legendary":
        minsize = "100000"
        maxsize= "10000000"
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
        pages[i].thumbnail = '';
      }


      // get page description/preview
      const params2 = {
        action: 'query',
        format: 'json',
        prop: 'extracts',
        exsentences: '5',
        exlimit: '1',
        titles: pages[i].title, // String(r[3][0]).split("/")[String(r[3][0]).split("/").length - 1],
        explaintext: '1',
        formatversion: '2'
      }
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params2).toString()
      var rev = await (await fetch(url)).json();
      var maxLen = 400
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