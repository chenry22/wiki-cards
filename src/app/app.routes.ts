import { Routes } from '@angular/router';
import { TimerPage } from './timer-page/timer-page';
import { PackPage } from './pack-page/pack-page';
import { AccountPage } from './account-page/account-page';
import { PacksPage } from './packs-page/packs-page';
import { CollectionPage } from './collection-page/collection-page';
import { ProfilePage } from './profile-page/profile-page';
import { BuyPackPage } from './buy-pack-page/buy-pack-page';
import { CommunityPage } from './community-page/community-page';

export const routes: Routes = [
    { path: '', component: TimerPage },
    { path: 'community', component: CommunityPage },
    { path: 'pack/:pack_id', component: PackPage }, 
    { path: 'buy_packs', component: BuyPackPage },

    { path: 'profile/:username', component: ProfilePage },
    { path: 'packs', component: PacksPage }, 
    { path: 'collection', component: CollectionPage },
    { path: 'sign_in', component: AccountPage },

    { path: '**', component: AccountPage }
];
