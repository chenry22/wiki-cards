import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { DocumentSnapshot, Firestore, addDoc, collection, deleteDoc, doc, documentId, getCountFromServer, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, setDoc, startAfter, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateCurrentUser, updateProfile, user } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { Profile } from './profile-page/profile-page';
import { Effect, WikiCard } from './collection-page/collection-page';
import { Binder } from './binder-page/binder-page';

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

  async completeSession(seconds: number, cardReward: number, goals: string[]) {
    var username = this.username();
    if (username === null) { 
      return false; 
    }

    await addDoc(collection(this.firestore, "users", username, "sessions"), 
      { minutes: Math.round(seconds / 60), goals: goals, completed: new Date() }
    );
    return await this.createPack(cardReward);
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

    // update profile stats
    batch.update(doc(this.firestore, "users", username), {
      packs: increment(1),
      cards: increment(cards.length)
    })

    await batch.commit();
    console.log("Pack opened! (batch committed)")
  }

  async loadCollection(username: string, lastDoc: DocumentSnapshot | null, lim: number = 5) {
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
  async loadCollectionByDate(username: string, lastDoc: DocumentSnapshot | null, lim: number = 5) {
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
  async loadCollectionByEffect(username: string, lastDoc: DocumentSnapshot | null, lim: number = 5) {
    var q = query(collection(this.firestore, "cards"), 
        where('username', '==', username), where("effect", "!=", "none"),
        orderBy("effect", 'desc'), orderBy("created", 'desc'), limit(lim)
    );
    if (lastDoc) {
      q = query(collection(this.firestore, "cards"), 
        where('username', '==', username), where("effect", "!=", "none"),
        orderBy("effect", 'desc'), orderBy("created", 'desc'), limit(lim), 
        startAfter(lastDoc)
      );
    }

    var snapshot = await getDocs(q);
    return snapshot.docs;
  }
  async loadCollectionByStar(username: string, lastDoc: DocumentSnapshot | null, lim: number = 5) {
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
      return false;
    }

    var snapshot = await getDoc(doc(this.firestore, "users", username));
    var data = snapshot.data();
    if (data === undefined) {
      console.log("Failed to parse user data");
      return false;
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
      return true;
    } else {
      alert("You already claimed your daily pack today.");
      return false;
    }
  }

  async hoursUntilDailyPack() {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return 100;
    }

    var snapshot = await getDoc(doc(this.firestore, "users", username));
    var data = snapshot.data();
    if (data === undefined) {
      console.log("Failed to parse user data");
      return 100;
    }

    let check = new Date();
    if (data['lastClaim'] === undefined) {
      return 0;
    } else {
      let date: Date =  data['lastClaim'].toDate()
      return Math.ceil((date.getTime() + (1000 * 60 * 60 * 24) - check.getTime()) / (1000 * 60 * 60));
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
          effect: d['effect'],
          original_owner: d['ogOwner'] ?? d['username']
        };
      });
    }
    return data;
  }

  async loadProfileStats(username: string) {
    var profile = await getDoc(doc(this.firestore, "users", username));
    var data = profile.data();
    if (data) {
      return {
        bio: data['bio'] ?? '',
        cards: data['cards'] ?? 0,
        packs: data['packs'] ?? 0,
        coins: data['balance'] ?? 0
      }
    } else {
      return null;
    }
  }

  async saveNewBio(bio: string) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return;
    }
    await updateDoc(doc(this.firestore, 'users', username), { bio: bio });
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
    var q = query(collection(this.firestore, "users"),
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

  async loadRecentCards(lim: number, lastDoc: DocumentSnapshot | null) {
    var q = query(collection(this.firestore, 'cards'),
      orderBy('created', 'desc'), limit(lim)
    );
    if(lastDoc) {
      q = query(collection(this.firestore, 'cards'),
        orderBy('created', 'desc'), limit(lim), startAfter(lastDoc)
      );
    }
    var snapshot = await getDocs(q);
    return snapshot.docs
  }

  async loadBinder(binderID: string) : Promise<Binder | null> {
    let snapshot = await getDoc(doc(this.firestore, 'binders', binderID));
    let data = snapshot.data();
    if (!snapshot.exists() || !data) {
      return null;
    }

    if (data['username'] !== this.username() && data['private']) {
      return null;
    }

    let q = query(collection(this.firestore, "binders", binderID, "cards"),
      orderBy('index', 'asc')
    );
    let cards = await getDocs(q);

    return {
      id: binderID,
      username: data['username'],
      private: data['private'],
      lastUpdated: data['lastUpdated'].toDate(),
      title: data['title'],
      color: data['color'],
      cards: cards.docs.map((doc) => {
        let d = doc.data()
        return {
          id: doc.id,
          rarity: this.rarityNumberToString(d['rarity']),
          wiki_id: d['id'],
          title: d['title'],
          link: d['link'],
          thumbnail: d['thumbnail'],
          created: d['created'],
          starred: d['starred'] ?? false,
          effect: d['effect'],
          index: d['index'],
          username: d['username'],
          orginal_owner: d['original_owner'] ?? d['username']
        }
      })
    }
  }

  async createBinder(title: string, color: string, privateBinder: boolean, cards: Set<WikiCard>) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return undefined;
    }

    const collectionRef = collection(this.firestore, 'binders');
    const { id } = doc(collectionRef);

    let binder: Binder = {
      id: id,
      username: username,
      title: title,
      private: privateBinder,
      color: color,
      lastUpdated: new Date,
      cards: Array.from(cards.entries())
    }

    let batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, "binders", binder.id),
      {
        username: username,
        private: binder.private,
        lastUpdated: binder.lastUpdated,
        title: binder.title,
        color: binder.color
      }
    );
    var i = 0;
    for (var card of cards) {
      batch.set(doc(this.firestore, "binders", binder.id, "cards", card.id),
        {
          id: card.id,
          rarity: this.rarityStringToNumber(card.rarity),
          wiki_id: card.wiki_id,
          title: card.title,
          link: card.link,
          thumbnail: card.thumbnail,
          created: card.created,
          effect: card.effect,
          index: i
        }
      )
      i++;
    }
    await batch.commit();
    return binder;
  }

  async loadUserBinders(username: string) : Promise<Binder[]> {
    let q = query(collection(this.firestore, "binders"),
      where('username', '==', username)
    );
    let binders = await getDocs(q);

    return binders.docs.map((doc) => {
      let data = doc.data();
      return {
        id: doc.id,
        username: data['username'],
        private: data['private'],
        lastUpdated: data['lastUpdated'].toDate(),
        title: data['title'],
        color: data['color'],
        cards: []
      }
    })
  }

  async editBinder(binderID: string, newBinderName: string, newBinderColor: string, newBinderPrivacy: boolean, editedCards: Map<string, number>) {
    var username = this.username();
    if (username === null) {
      console.log("No user logged in...");
      return false
    }
    
    let batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'binders', binderID), {
      title: newBinderName,
      color: newBinderColor,
      private: newBinderPrivacy,
      lastUpdated: new Date()
    })
    editedCards.forEach((index, cardID) => {
      batch.update(doc(this.firestore, 'binders', binderID, 'cards', cardID), {
        index: index
      })
    })
    await batch.commit();
    return true;
  }

  async loadRecentBinders(lim: number) {
    let q = query(collection(this.firestore, "binders"),
      where('private', '==', false), orderBy('lastUpdated', 'desc'), limit(lim)
    );
    let binders = await getDocs(q);
    return binders.docs.map((doc) => {
      let data = doc.data();
      return {
        id: doc.id,
        username: data['username'],
        private: data['private'],
        lastUpdated: data['lastUpdated'].toDate(),
        title: data['title'],
        color: data['color'],
        cards: []
      }
    })
  }

  async addToBinder(card: WikiCard | undefined, binder: any) {
    var username = this.username();
    if (card == null) { 
      return "Invalid card"; 
    }
    if (username === null) {
      return "You must be logged in to do this"
    } else if (username !== binder.username) {
      return "You don't own this binder";
    }

    let q = query(collection(this.firestore, "binders", binder.id, 'cards'),
      orderBy('index', 'desc'), limit(1)
    );
    let docs = await getDocs(q);

    if(docs.empty) {
      // index = 0
      await setDoc(doc(this.firestore, 'binders', binder.id, 'cards', card.id), 
        {
          rarity: this.rarityStringToNumber(card.rarity),
          wiki_id: card.wiki_id,
          title: card.title,
          link: card.link,
          thumbnail: card.thumbnail,
          created: card.created,
          effect: card.effect,
          index: 0
        }
      )
    } else {
      let index = docs.docs[0].data()['index'] + 1
      await setDoc(doc(this.firestore, 'binders', binder.id, 'cards', card.id), 
        {
          id: card.id,
          rarity: this.rarityStringToNumber(card.rarity),
          wiki_id: card.wiki_id,
          title: card.title,
          link: card.link,
          thumbnail: card.thumbnail,
          created: card.created,
          effect: card.effect,
          index: index
        }
      )
    }
    return undefined;
  }

  async removeFromBinder(card: WikiCard | undefined, binder: any) {
    var username = this.username();
    var id = card?.id;
    if (id == null) { 
      return "Invalid card"; 
    }
    if (username === null) {
      return "You must be logged in to do this"
    } else if (username !== binder.username) {
      return "You don't own this binder";
    }

    await deleteDoc(doc(this.firestore, 'binders', binder.id, 'cards', id))
    return undefined;
  }

  async deleteBinder(binder: Binder) {
    var username = this.username();
    if (username === null) {
      return "You must be logged in to do this"
    } else if (username !== binder.username) {
      return "You don't own this binder";
    }

    await deleteDoc(doc(this.firestore, 'binders', binder.id))
    return undefined
  }

  async loadSessions(lim: number, lastDoc: DocumentSnapshot | null) {
    var username = this.username();
    if (username === null) {
      return undefined;
    }

    var q = query(collection(this.firestore, 'users', username, 'sessions'),
      orderBy('completed', 'desc'), limit(lim)
    );
    if(lastDoc) {
      q = query(collection(this.firestore, 'users', username, 'sessions'),
        orderBy('completed', 'desc'), limit(lim), startAfter(lastDoc)
      );
    }

    let sessions = await getDocs(q);
    console.log(sessions.docs)
    return sessions.docs.map((doc) => {
      let d = doc.data()
      return {
        minutes: d['minutes'],
        goals: d['goals'],
        completed: d['completed'].toDate()
      }
    });
  }
}
