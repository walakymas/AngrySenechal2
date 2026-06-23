import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CharacterDetailComponent } from './character-detail/character-detail.component';
import { ChargenComponent } from './chargen/chargen.component';
import { TeamComponent } from './team/team.component';
import { AdminComponent } from './admin/admin.component';
import { FeastComponent } from './feast/feast.component';
import { MapsComponent } from './maps/maps.component';

const routes: Routes = [
  { path: '', redirectTo: '/character', pathMatch: 'full' },
  { path: 'character', component: CharacterDetailComponent },
  { path: 'character/:name', component: CharacterDetailComponent },
  { path: 'team', component: TeamComponent },
  { path: 'feast', component: FeastComponent },
  { path: 'maps', component: MapsComponent },
  { path: 'chargen', component: ChargenComponent },
  { path: 'admin', component: AdminComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
