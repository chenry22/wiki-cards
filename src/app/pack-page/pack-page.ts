import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pack-page',
  imports: [MatCardModule],
  templateUrl: './pack-page.html',
  styleUrl: './pack-page.css',
})
export class PackPage {
  public pages: any;

  async getRandomWikiPages(count=5) {
    var url = "https://en.wikipedia.org/w/api.php"; 

    var params = {
      action: "query",
      format: "json",
      list: "random",
      rnlimit: String(count),
      rnnamespace: "0", // main, so only real articles
      minsize: "500", // min number of bytes in each article
    };

    url = url + "?origin=*";
    Object.entries(params).forEach(
      ([key, value]) => url += "&" + key + "=" + value
    );

    const response = await (await fetch(url)).json();
    this.pages = response.query.random;
    for (var i in this.pages) {
      // get data for page
      const params = {
        action: "opensearch",
        search: this.pages[i].title,
        limit: "1",
        namespace: "0",
        format: "json",
      };
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params).toString();
      const r = await (await fetch(url)).json();
      this.pages[i].desc = r[2][0];
      this.pages[i].link = String(r[3][0]);


      // get page image
      const params3 = {
        action: 'query',
        titles: this.pages[i].title,
        prop: 'pageimages',
        pithumbsize: '400',
        format: 'json',
        formatversion: '2'
      }
      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params3).toString()

      var rev = await (await fetch(url)).json();
      console.log(rev);


      // get page preview/description
      const params2 = {
        action: "query",
        format: "json",
        prop: "revisions",
        titles: this.pages[i].title,
        formatversion: '2',
        rvprop: 'content',
        rvslots: '*'
      };

      url = "https://en.wikipedia.org/w/api.php?origin=*&" + new URLSearchParams(params2).toString()
      var rev = await (await fetch(url)).json();
      if (rev && rev.query && rev.query.pages && rev.query.pages[0].revisions) {
        this.pages[i].desc = 
          String(rev.query.pages[0].revisions[0].slots.main.content)
            .substring(0, 500).split("}}");
        var formatted = [];
        for (var j in this.pages[i].desc) {
          if (String(this.pages[i].desc[j]).includes("{{")) {
            if (String(this.pages[i].desc[j]).includes("description|")) {
              formatted.push(String(this.pages[i].desc[j]).substring(20));
            } else {
              formatted.push(String(this.pages[i].desc[j]).substring(2));
            }
          } else {
            formatted.push(String(this.pages[i].desc[j]));
          }
        }
        console.log(formatted);
        this.pages[i].desc = formatted;
        
      } else {
        console.log(rev);
      }
    }
  }

  getPageLink(page: any) {
    return page?.link;
  }
}
