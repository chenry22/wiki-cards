import { Routes } from '@angular/router';
import { TimerPage } from './timer-page/timer-page';
import { PackPage } from './pack-page/pack-page';
import { AccountPage } from './account-page/account-page';

export const routes: Routes = [
    { path: '', component: AccountPage },
    { path: 'timer', component: TimerPage },
    { path: 'pack/:session_id', component: PackPage }, 
    { path: '**', component: AccountPage }
];
