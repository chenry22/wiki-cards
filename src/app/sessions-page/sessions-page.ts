import { Component, effect, inject } from '@angular/core';
import { Firebase } from '../firebase';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-sessions-page',
  imports: [MatCardModule],
  templateUrl: './sessions-page.html',
  styleUrl: './sessions-page.css',
})
export class SessionsPage {
  firebase = inject(Firebase);
  sessions: any[] = [];
  lastSessionDoc: DocumentSnapshot | null = null;
  loading = true;

  private reloadEffect = effect(async () => {
    this.loading = true;
    this.sessions = [];
    this.lastSessionDoc = null;
    await this.loadSessions();
    this.loading = false;
  });

  async loadSessions() {
    var seshs = await this.firebase.loadSessions(10, this.lastSessionDoc);
    console.log(seshs)
    if (seshs) {
      this.sessions = seshs;
    }
  }

  sessionStartDate(session: any) {
    let time = session.completed - (session.minutes * 60 * 1000);
    let date = new Date(time);
    return date.toLocaleString('en-US', {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  timeSince(date: string) {
    var seconds = Math.floor((Date.now() - Date.parse(date)) / 1000);
    var interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " month" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " day" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hour" + (Math.floor(interval) > 1 ? "s" : "");
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minute" + (Math.floor(interval) > 1 ? "s" : "");
    }
    return Math.floor(seconds) + " second" + (Math.floor(interval) > 1 ? "s" : "");
  }
}
