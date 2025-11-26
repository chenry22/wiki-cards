import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firebase } from '../firebase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-timer-page',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.css',
})
export class TimerPage {
  private increment = 5 * 60;
  private minTime = 5 * 60;
  private maxTime = 2 * 60 * 60;

  private timeRemaining = signal(30 * 60);
  private timerInit = signal(30 * 60)
  private timerId: number | null = null;

  private cardTimeRewardRate = 60 * 10;
  get cardReward() {
    if (this.timerActive) {
      return Math.max(1, Math.floor(this.timerInit() / this.cardTimeRewardRate));
    } else {
      return Math.max(1, Math.floor(this.timeRemaining() / this.cardTimeRewardRate));
    }
  };
  
  timerActive = false;
  paused = false;
  private packAvailable = false;

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
    if (!this.timerActive || this.paused) {
      this.timerActive = true;
      this.paused = false;
      if (this.timerId == null) {
        // means we're starting a whole new timer
        // otherwise we have a previous valid timer that was paused, so just continue that
        this.timerInit.set(this.timeRemaining());
      }
      this.timerId = setInterval(() => {
        this.timeRemaining.update((time) => {
          if (time <= 1) {
            this.stopTimer(true);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
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
