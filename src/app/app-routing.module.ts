import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CharacterDetailComponent } from './character-detail/character-detail.component';
import { ChargenComponent } from './chargen/chargen.component';
import { TeamComponent } from './team/team.component';

const routes: Routes = [
  { path: '', redirectTo: '/character/Perin', pathMatch: 'full' },
  { path: 'character/:name', component: CharacterDetailComponent },
  { path: 'team', component: TeamComponent },
  { path: 'chargen', component: ChargenComponent }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
