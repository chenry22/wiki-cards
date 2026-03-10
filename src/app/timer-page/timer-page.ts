import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Firebase } from '../firebase';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timer-page',
  imports: [MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.css',
})
export class TimerPage {
  firebase = inject(Firebase);

  goal = '';
  goals: string[] = [];

  completed: string[] = [];
  claimed = false;
  
  private increment = 5 * 60;
  private minTime = 15 * 60;
  private maxTime = 180 * 60;

  private timeRemaining = signal(30 * 60);
  private timerInit = signal(30 * 60);
  private timerEnd = signal(0);
  private timerId: number | null = null;

  private cardTimeRewardRate = 60 * 10;
  private cardMultRate = 60 * 230;
  private maxCardMult = 1.4;
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

  addGoal() {
    if (this.goal.length > 0) {
      this.goals.push(this.goal);
      this.goal = '';
    }
  }
  removeGoal(goal: string) {
    this.goals = this.goals.filter((val) => { 
      return val != goal 
    })
  }
  completeGoal(goal: string) {
    this.removeGoal(goal);
    this.completed.push(goal);
  }
  removeCompleted(goal: string) {
    this.completed = this.completed.filter((val) => { 
      return val != goal 
    })
  }
  
  isPackAvailable() {
    return this.packAvailable; //this.packAvailable;
  }

  async claimPack() {
    // create new doc in firebase users/packs
    if (this.isPackAvailable()) {
      this.packAvailable = false;
      if (await this.firebase.completeSession(this.timerEnd() - this.timerInit(), this.cardReward, this.goals)){
        this.timerActive = false;
        this.claimed = true;
      } else {
        alert("Failed to redeem pack. Please try again.");
        this.packAvailable = true;
      }
    }
  }

  formatTime(seconds: number) {
    if (seconds > 60) {
      return String(Math.floor(seconds / 3600)).padStart(2, '0')
        + ":" + String(Math.floor(seconds / 60) % 60).padStart(2, '0') 
        + ":" + String(seconds % 60).padStart(2, '0')
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
    if (this.packAvailable) { 
      alert("Please claim your pack to end your current session!");
      return; 
    }

    if (!this.timerActive || this.paused) {
      this.claimed = false;
      this.timerActive = true;
      this.paused = false;
      let curr = (new Date()).getTime() / 1000;

      this.timerEnd.set(curr + this.timeRemaining())
      let t = Math.ceil(this.timerEnd() - curr);
      this.timeRemaining.set(t);

      var timerID = setInterval(() => {
        let t = Math.ceil(this.timerEnd() - (new Date()).getTime() / 1000);
        if (t <= 1) {
          clearInterval(timerID);
          this.timerId = null;
          this.packAvailable = true;
        } else {
          this.timeRemaining.set(t - 1);
        }
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
