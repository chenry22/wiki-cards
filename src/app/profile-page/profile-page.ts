import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Firebase } from '../firebase';
import { MatCardModule } from '@angular/material/card';
import { CollectionPage, Effect, WikiCard } from '../collection-page/collection-page';
import { FullCard } from '../full-card/full-card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { SessionsPage } from '../sessions-page/sessions-page';

export interface Profile {
  username: string,
  pfp: string | null,
  joined: Date,
  featured: any[]
}

@Component({
  selector: 'app-profile-page',
  imports: [MatCardModule, FullCard, CollectionPage, SessionsPage,
    MatIconModule, MatDividerModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})

export class ProfilePage {
  firebase = inject(Firebase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  profile: Profile = {
    username: '---',
    pfp: null,
    joined: new Date(),
    featured: [],
  };
  notFound = false;

  currentUser = false;
  stats = {
    bio: '',
    packs: 0,
    cards: 0,
    coins: 0
  }

  editingBio = false;
  editedBio = '';

  selectedCard: WikiCard | undefined;
  selected = false;

  tab = 'about';

  private reloadEffect = effect(() => {
    // when username signal updates, this will reload for user
    this.currentUser = this.firebase.username() === this.profile.username;
  });

  constructor() {
    // Access route parameters
    this.route.params.subscribe(params => {
      var username = params['username'] || '';
      this.profile.username = username;
      this.loadProfile(username);
    });

    this.route.url.subscribe(url => {
      let last = url.pop();
      if(!last) { return; }
      if (last.path === 'collection') {
        this.showTab('collection');
      } else if (last.path === 'sessions') {
        this.showTab('sessions');
      }
    })
  }

  async loadProfile(username: string) {
    var tmp = await this.firebase.loadProfile(username);
    if (tmp) {
      this.currentUser = this.firebase.username() === username;
      this.profile = tmp;

      let statsTmp = await this.firebase.loadProfileStats(username);
      if (statsTmp) {
        this.stats = statsTmp;
      }
    } else {
      this.notFound = true;
    }
  }

  showFullCard(card: WikiCard) {
    this.selectedCard = card;
    this.selected = true;
  }

  toggleEditBio() {
    this.editedBio = this.stats.bio;
    this.editingBio = !this.editingBio;
  }
  saveBio() {
    this.stats.bio = this.editedBio;
    this.firebase.saveNewBio(this.editedBio);
    this.toggleEditBio();
  }

  showTab(tab: string) {
    if (this.tab !== tab) {
      this.tab = tab;
      this.location.replaceState(`/profile/${this.profile.username}/${tab === 'about' ? '' : tab}`)
    }
  }
}
