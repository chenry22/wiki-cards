import { Routes } from '@angular/router';
import { TimerPage } from './timer-page/timer-page';
import { PackPage } from './pack-page/pack-page';
import { AccountPage } from './account-page/account-page';
import { PacksPage } from './packs-page/packs-page';
import { CollectionPage } from './collection-page/collection-page';
import { ProfilePage } from './profile-page/profile-page';
import { FullCard } from './full-card/full-card';
import { BuyPackPage } from './buy-pack-page/buy-pack-page';

export const routes: Routes = [
    { path: 'sign_in', component: AccountPage },
    { path: '', component: TimerPage },
    { path: 'pack/:pack_id', component: PackPage }, 
    { path: 'buy_packs', component: BuyPackPage },

    { path: 'profile/:username', component: ProfilePage },
    { path: 'packs', component: PacksPage }, 
    { path: 'collection', component: CollectionPage },

    { path: '**', component: AccountPage }
];
