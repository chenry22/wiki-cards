import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { DocumentSnapshot, Firestore, addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, setDoc, startAfter, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateCurrentUser, updateProfile, user } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { Profile } from './profile-page/profile-page';
import { Effect, WikiCard } from './collection-page/collection-page';

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
        { joined: new Date(), balance: 0 }
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

  rarityStringToNumber(r: string) {
    if (r === "common") {
      return 0;
    } else if (r === "uncommon") {
      return 1;
    } else if (r === "rare") {
      return 2;
    } else if (r === "epic") {
      return 3;
    } else {
      return 4;
    }
  }
  rarityNumberToString(r: number) {
    if (r == 0) {
      return "common";
    } else if (r == 1) {
      return "uncommon";
    } else if (r == 2) {
      return "rare";
    } else if (r == 3) {
      return "epic"
    } else if (r == 4) {
      return "legendary"
    } else {
      return "error"
    }
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
      batch.set(doc(this.firestore, "cards", packID + i), 
        { 
          id: cards[i].id,
          username: username,
          starred: false,

          title: cards[i].title,
          thumbnail: cards[i].thumbnail,
          link: cards[i].link,
          rarity: this.rarityStringToNumber(cards[i].rarity),
          created: new Date(),
          effect: cards[i]?.effect ?? Effect.none
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

    var lastClaim: Date;
    var differentDay;
    if (data['lastClaim']) {
      lastClaim = data['lastClaim'].toDate();
      let check = new Date();
      differentDay = check.getFullYear() !== lastClaim.getFullYear() ||  
        check.getMonth() !== lastClaim.getMonth() ||
        check.getDate() !== lastClaim.getDate();
    }

    if (data['lastClaim'] === undefined || differentDay) {
      await this.createPack(3);
      await updateDoc(doc(this.firestore, "users", username), { lastClaim : new Date() });
      alert("Daily pack claimed!");
    } else {
      alert("You already claimed your daily pack today.");
    }
  }
  
  async loadProfile(username: string) {
    var data: Profile = {
      username: username,
      pfp: null,
      joined: new Date(),
      featured: new Array<WikiCard>()
    };

    var profile = await getDoc(doc(this.firestore, "users", username));
    var profileData = profile.data();
    if (!profile.exists() || profileData === undefined) {
      return null;
    }

    data.pfp = profileData['pfp'];
    data.joined = profileData['joined'].toDate();

    var featured = await getDocs(collection(this.firestore, 'users', username, 'featured'));
    if (!featured.empty) {
      data.featured = featured.docs.map((cardData) => {
        var d = cardData.data();
        var r = d['rarity'];
        if (r == 0) {
          r = "common"
        } else if (r == 1) {
          r = "uncommon";
        } else if (r == 2) {
          r = "rare";
        } else if (r == 3) {
          r = "epic"
        } else if (r == 4) {
          r = "legendary"
        }
        return {
          id: cardData.id,
          rarity: r,
          wiki_id: d['id'],
          title: d['title'],
          link: d['link'],
          thumbnail: d['thumbnail'],
          created: d['created'],
          starred: d['starred'],
          effect: d['effect']
        };
      });
    }
    return data;
  }

  async sellCard(cardId: string, value: number) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return false;
    }

    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, "users", username), 
      { balance: increment(value) }
    )
    batch.delete(doc(this.firestore, "cards", cardId));
    await batch.commit();
    return true;
  }

  async setProfilePicture(url: string) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }
    await updateDoc(doc(this.firestore, 'users', username),
      { pfp: url }
    )
  }

  async setFeaturedCard(card: WikiCard) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return false;
    }

    // check if card already featured
    var check = await getDoc(doc(this.firestore, 'users', username, 'featured', card.id));
    if (check.exists()) {
      alert("This card is already featured on your profile.");
      return false;
    }

    // add or replace from featured
    var cardData = {
      id: card.id,
      username: username,

      title: card.title,
      thumbnail: card.thumbnail,
      link: card.link,
      rarity: this.rarityStringToNumber(card.rarity),
      effect: card.effect,
      created: card.created,
    };

    var currFeatured = await getCountFromServer(collection(this.firestore, 'users', username, 'featured'));    
    if (currFeatured.data().count >= 5) {
      var q = await query(collection(this.firestore, "users", username, "featured"),
        where('num', '==', 5),
      )
      var snapshot = await getDocs(q);

      const batch = writeBatch(this.firestore);
      batch.delete(doc(this.firestore, "users", username, "featured", snapshot.docs[0].id));
      batch.set(doc(this.firestore, "users", username, "featured", card.id),
        cardData
      );
      await batch.commit();
    } else {
      await setDoc(doc(this.firestore, "users", username, "featured", card.id),
        { ...cardData, num: currFeatured.data().count + 1 }
      );
    }

    alert("Successfully added to featured cards!");
    return true;
  }

  async removeFeaturedCard(card: WikiCard) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return false;
    }

    await deleteDoc(doc(this.firestore, 'users', username, 'featured', card.id));
    return true;
  }

  async loadBalance() {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return 0;
    }

    let user = await getDoc(doc(this.firestore, "users", username));
    let data = user.data();
    if (data === undefined) { return 0; }
    return data['balance'] ?? 0;
  }

  async buyPack(size: number, cost: number) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return false;
    }
    
    let userRef = doc(this.firestore, "users", username);
    let newPackRef = doc(collection(this.firestore, "users", username, "packs"));
    try {
      await runTransaction(this.firestore, async (transaction) => {
        let userDoc = await transaction.get(userRef);
        let data = userDoc.data();
        if (!data || data['balance'] < cost ) {
          alert("Insufficient funds.");
          throw "Insufficient funds.";
        }

        transaction.set(newPackRef, 
          { cards: size, created: new Date() }
        );
        transaction.update(userRef, 
          { balance: increment(-cost) }
        )
      });
      return true;
    } catch (e) {
      console.log("Transaction failed: ", e);
      return false;
    }
  }

  async loadRandomProfiles(lim: number) {
    var q = await query(collection(this.firestore, "users"),
        orderBy('joined', 'desc'), limit(lim),
      )
    var snapshot = await getDocs(q);
    var profiles: Profile[] = snapshot.docs.map((doc) => {
      let data = doc.data();
      return {
        username: doc.id,
        pfp: data['pfp'],
        joined: data['joined'].toDate(),
        featured: []
      };
    })
    return profiles;
  }

  async loadRecentCards(lim: number) {
    var q = await query(collection(this.firestore, 'cards'),
      orderBy('created', 'desc'), limit(lim)
    );
    var snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      let data = doc.data();
      return {
        id: doc.id,
        username: data['username'],

        title: data['title'],
        thumbnail: data['thumbnail'],
        link: data['link'],
        rarity: this.rarityNumberToString(data['rarity']),
        effect: data['effect'],
        created: data['created'].toDate(),
      };
    })
  }
}
