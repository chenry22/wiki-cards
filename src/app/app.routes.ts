import { Routes } from '@angular/router';
import { TimerPage } from './timer-page/timer-page';
import { PackPage } from './pack-page/pack-page';

export const routes: Routes = [
    { path: '', component: TimerPage },
    { path: 'pack/:session_id', component: PackPage }, 
];
