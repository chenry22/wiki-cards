import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { DocumentSnapshot, Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter, writeBatch } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signInAnonymously, signOut, user } from '@angular/fire/auth'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  router = inject(Router);
  firestore = inject(Firestore);
  auth = inject(Auth);

  username: WritableSignal<string | null> = signal(null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log("New user signed in!");
        this.username.set(localStorage.getItem('username'));

        var username = this.username();
        if (username) {
          var newUser = doc(this.firestore, "users", username);
          setDoc(newUser, { lastLogin: new Date() }, { merge: true});
        }
      } else {
        console.log("User signed out")
        this.username.set(null);
        this.router.navigateByUrl('/');
      }
    });
  }

  async signIn(username: string) {
    localStorage.setItem('username', username);
    await signInAnonymously(this.auth);
    return true;
  }

  async signOut() {
    localStorage.removeItem('username');
    await signOut(this.auth);
  }

  async createPack(cards: number) {
    var username = this.username();
    if (username === null) { 
      return false; 
    }
    
    await addDoc(collection(this.firestore, "users", username, "packs"), 
      { cards: cards, created: new Date() }
    );
    return true;
  }

  async loadAvailablePacks() {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return [];
    }

    // var snapshot = await getDocs(collection(this.firestore, "users", username, "packs"));
    var q = query(collection(this.firestore, "users", username, "packs"), 
        orderBy("created", 'desc'), limit(10)
    );
    var snapshot = await getDocs(q);
    return snapshot.docs;
  }

  async loadPackSize(packID: string) {
    if (packID === '') {
      console.log("Invalid packID");
      return 0;
    }
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return 0;
    }

    var snapshot = await getDoc(doc(this.firestore, "users", username, "packs", packID));
    var data = snapshot.data();
    if (data === undefined) {
      return 0;
    }
    return Number(data['cards']);
  }

  async openPack(packID: string, cards: any[]) {
    if (packID === '') {
      console.log("Invalid packID");
      return;
    }
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }

    const batch = writeBatch(this.firestore);

    // add docs to user collection
    for(var i in cards) {
      var r = cards[i].rarity;
      if (r === "common") {
        r = 0;
      } else if (r === "uncommon") {
        r = 1;
      } else if (r === "rare") {
        r = 2;
      } else if (r === "epic") {
        r = 3;
      } else {
        r = 4;
      }

      batch.set(doc(this.firestore, "users", username, "cards", packID + i), 
        { 
          id: cards[i].id,
          title: cards[i].title,
          thumbnail: cards[i].thumbnail,
          link: cards[i].link,
          rarity: Number(r),
          created: new Date(),
        }
      );
    }
    
    // delete pack (cannot double redeem)
    batch.delete(doc(this.firestore, "users", username, "packs", packID));
    await batch.commit();
    console.log("Pack opened! (batch committed)")
  }

  async loadCollection(lastDoc: DocumentSnapshot | null, lim: number = 5) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return [];
    }
    
    var q = query(collection(this.firestore, "users", username, "cards"), 
        orderBy("created"), limit(lim)
    );
    if (lastDoc) {
      q = query(collection(this.firestore, "users", username, "cards"), 
        orderBy("created"), limit(lim), startAfter(lastDoc)
      );
    }

    var snapshot = await getDocs(q);
    return snapshot.docs;
  }
}
