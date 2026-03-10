import { Routes } from '@angular/router';
import { TimerPage } from './timer-page/timer-page';
import { PackPage } from './pack-page/pack-page';
import { AccountPage } from './account-page/account-page';
import { PacksPage } from './packs-page/packs-page';
import { CollectionPage } from './collection-page/collection-page';
import { ProfilePage } from './profile-page/profile-page';
import { CommunityPage } from './community-page/community-page';
import { BinderPage } from './binder-page/binder-page';
import { HomePage } from './home-page/home-page';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'timer', component: TimerPage},
    { path: 'community', component: CommunityPage },
    { path: 'pack/:pack_id', component: PackPage }, 

    { path: 'profile/:username', component: ProfilePage },
    { path: 'profile/:username/collection', component: ProfilePage },
    { path: 'binder/:binder_id', component: BinderPage },
    { path: 'packs', component: PacksPage },

    { path: 'sign_in', component: AccountPage },
    { path: 'create_account', component: AccountPage, data: { create:true }},

    { path: '**', component: HomePage }
];
