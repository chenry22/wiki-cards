import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Firebase } from '../firebase';

@Component({
  selector: 'app-timer-page',
  imports: [MatIconModule, MatButtonModule, MatInputModule],
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.css',
})
export class TimerPage {
  firebase = inject(Firebase);
  
  private increment = 5 * 60;
  private minTime = 5 * 60;
  private maxTime = 120 * 60;

  private timeRemaining = signal(30 * 60);
  private timerInit = signal(30 * 60)
  private timerId: number | null = null;

  private cardTimeRewardRate = 60 * 12;
  private cardMultRate = 60 * 120;
  private maxCardMult = 1.8;
  get cardReward() {
    if (this.timerActive) {
      var mult = Math.min(this.maxCardMult, 1 + this.timerInit() / this.cardMultRate);
      return Math.max(1, Math.floor(this.timerInit() / this.cardTimeRewardRate * mult));
    } else {
      var mult = Math.min(this.maxCardMult, 1 + this.timeRemaining() / this.cardMultRate);
      return Math.max(1, Math.floor(this.timeRemaining() / this.cardTimeRewardRate * mult));
    }
  };
  
  timerActive = false;
  paused = false;
  private packAvailable = false;

  isPackAvailable() {
    return this.packAvailable; //this.packAvailable;
  }

  async claimPack() {
    // create new doc in firebase users/packs
    if (this.isPackAvailable()) {
      this.packAvailable = false;
      if (await this.firebase.createPack(this.cardReward)){
        alert("Pack redeemed!");
        this.timerActive = false;
      } else {
        alert("Failed to redeem pack. Please try again.");
        this.packAvailable = true;
      }
      this.packAvailable = false;
    }
  }

  formatTime(seconds: number) {
    if (seconds > 60) {
      return String(Math.floor(seconds / 60)).padStart(2, '0') + ":" + String(seconds % 60).padStart(2, '0')
    } else {
      return "00:" + String(seconds).padStart(2, '0');
    }
  }
  displayTime() { 
    return this.formatTime(this.timeRemaining());
  }

  incrementTimer() {
    if (!this.timerActive && (this.timeRemaining() + this.increment <= this.maxTime)) {
      this.timeRemaining.update((t) => t + this.increment)
    }
  }
  decrementTimer() {
    if (!this.timerActive && (this.timeRemaining() - this.increment >= this.minTime)) {
      this.timeRemaining.update((t) => t - this.increment)
    }
  }

  beginTimer() {
    if (this.packAvailable) { return; }
    if (!this.timerActive || this.paused) {
      this.timerActive = true;
      this.paused = false;
      if (this.timerId == null) {
        // means we're starting a whole new timer
        // otherwise we have a previous valid timer that was paused, so just continue that
        this.timerInit.set(this.timeRemaining());
      }
      var timerID = setInterval(() => {
        this.timeRemaining.update((time) => {
          if (time <= 1) {
            clearInterval(timerID);
            this.timerId = null;
            this.packAvailable = true;
            return 0;
          }
          return time - 1;
        });
      }, 1000);
      this.timerId = timerID;
    }
  }
  pauseTimer() {
    if (!this.timerActive) { return; }

    this.paused = true;
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
  stopTimer(override = false) {
    if (this.timerActive && (override || confirm("Are you sure you want to cancel your active timer?"))) {
      this.timerActive = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      this.timeRemaining.set(this.timerInit());
    }
  }
}
