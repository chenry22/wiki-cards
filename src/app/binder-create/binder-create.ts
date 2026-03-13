import { Component, inject, input, model, output } from '@angular/core';
import { WikiCard } from '../collection-page/collection-page';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Firebase } from '../firebase';
import { Router } from '@angular/router';
import { Binder } from '../binder-page/binder-page';

@Component({
  selector: 'app-binder-create',
  imports: [MatCardModule, MatButtonModule, MatInputModule, 
    FormsModule, MatCheckboxModule, MatIconModule],
  templateUrl: './binder-create.html',
  styleUrl: './binder-create.css',
})
export class BinderCreate {
  firebase = inject(Firebase);
  router = inject(Router);

  shown = model<boolean>(false);
  cards = input<WikiCard[]>();

  loadMore = output();
  moreCards = input<boolean>();
  loading = input<boolean>();

  binderTitle = '';
  binderPrivate = false;
  binderColor = "#FFFFFF";
  binderCards: Set<WikiCard> = new Set<WikiCard>();

  hide() {
    if (!confirm("Cancel creating this binder?")) { return; }
    this.shown.set(false);
    this.binderTitle = '';
    this.binderPrivate = false;
    this.binderColor = 'white';
    this.binderCards.clear();
  }

  cardSelected(card: WikiCard) {
    return this.binderCards.has(card);
  }

  selectCard(card: WikiCard) {
    if (this.binderCards.has(card)) {
      this.binderCards.delete(card);
    } else {
      this.binderCards.add(card);
    }
  }

  async createBinder() {
    if (this.binderTitle === '') {
      alert("Please give your binder a title");
      return;
    } else if (this.binderCards.size === 0) {
      alert("Binders must have at least one card")
      return;
    }
    
    let b: Binder | undefined = await this.firebase.createBinder(this.binderTitle, this.binderColor, this.binderPrivate, this.binderCards);
    if (b !== undefined) {
      // show binder
      this.router.navigateByUrl("/binder/" + b.id);
    } else {
      alert("Failed to create binder.");
    }
  }
}
