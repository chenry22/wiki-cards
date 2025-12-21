import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { DocumentSnapshot, Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateCurrentUser, updateProfile, user } from '@angular/fire/auth'
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
        console.log(user);
        this.username.set(user.displayName);
      } else {
        console.log("User signed out")
        this.username.set(null);
        this.router.navigateByUrl('sign_in');
      }
    });
  }

  async signIn(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
    return true;
  }
  async createAccount(username: string, email: string, password: string) { 
    var check = await getDoc(doc(this.firestore, "users", username));
    if (check.exists()) {
      return false;
    }

    var userCred = await createUserWithEmailAndPassword(this.auth, email, password)
    await updateProfile(userCred.user, { displayName: username });
    this.username.set(username);
    try {
      await setDoc(doc(this.firestore, "users", username), 
        { joined: new Date() }
      )
    } catch (e) {
      console.log(e)
      return false;
    }

    return true;
  }

  async signOut() {
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

      batch.set(doc(this.firestore, "cards", packID + i), 
        { 
          id: cards[i].id,
          username: username,
          starred: false,

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
    
    var q = query(collection(this.firestore, "cards"), 
      where('username', '==', username),
      orderBy("rarity", 'desc'), limit(lim)
    );
    if (lastDoc) {
      q = query(collection(this.firestore, "cards"), 
        where('username', '==', username),
        orderBy("rarity", 'desc'), limit(lim), 
        startAfter(lastDoc)
      );
    }

    var snapshot = await getDocs(q);
    return snapshot.docs;
  }
  async loadCollectionByDate(lastDoc: DocumentSnapshot | null, lim: number = 5) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return [];
    }
    
    var q = query(collection(this.firestore, "cards"), 
      where('username', '==', username),
      orderBy("created", 'desc'), limit(lim)
    );
    if (lastDoc) {
      q = query(collection(this.firestore, "cards"), 
        where('username', '==', username),
        orderBy("created", 'desc'), limit(lim), 
        startAfter(lastDoc)
      );
    }

    var snapshot = await getDocs(q);
    return snapshot.docs;
  }
  async loadCollectionByStar(lastDoc: DocumentSnapshot | null, lim: number = 5) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return [];
    }
    
    var q = query(collection(this.firestore, "cards"), 
        where('username', '==', username),
        orderBy("starred", 'desc'), orderBy("created", 'desc'), limit(lim)
    );
    if (lastDoc) {
      q = query(collection(this.firestore, "cards"), 
        where('username', '==', username),
        orderBy("starred", 'desc'), orderBy("created", 'desc'), limit(lim), 
        startAfter(lastDoc)
      );
    }

    var snapshot = await getDocs(q);
    return snapshot.docs;
  }

  async starCard(id: string) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }
    await updateDoc(doc(this.firestore, "cards", id), "starred", true);
  }
  async unstarCard(id: string) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }
    await updateDoc(doc(this.firestore, "cards", id), "starred", false);
  }

  async claimDailyPack() {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }

    var snapshot = await getDoc(doc(this.firestore, "users", username));
    var data = snapshot.data();
    if (data === undefined) {
      console.log("Failed to parse user data");
      return;
    }

    var lastClaim = data['lastClaim'];
    var check = new Date();
    check.setTime(Date.now() - 24 * 60 * 60 * 1000);

    if (lastClaim === undefined || lastClaim.toDate() <= check) {
      await this.createPack(5);
      await updateDoc(doc(this.firestore, "users", username), "lastClaim", new Date());
      alert("Daily pack claimed!");
    } else {
      alert("You already claimed your daily pack today!");
    }
  }
}
