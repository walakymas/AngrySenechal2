import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { CharactersComponent } from './characters/characters.component';
import { CharacterDetailComponent, DialogContentExampleDialog, CharacterMainDialog, CharacterJsonDialog } from './character-detail/character-detail.component';
import { MessagesComponent } from './messages/messages.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule} from '@angular/material/icon';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { NpcDetailComponent } from './npc-detail/npc-detail.component';
import { TeamComponent } from './team/team.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditableComponent } from "./editable.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule} from '@angular/material/button';
import { MatMenuModule} from '@angular/material/menu';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatDialogModule} from '@angular/material/dialog';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule} from '@angular/material/input';
import { MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatStepperModule} from '@angular/material/stepper';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { ChargenComponent } from './chargen/chargen.component'
import {MatSliderModule} from '@angular/material/slider';
import {MatRadioModule} from '@angular/material/radio';
import { WINDOW, WINDOW_PROVIDERS } from './windows';
@NgModule({
  declarations: [
    AppComponent,
    CharactersComponent,
    CharacterDetailComponent,
    MessagesComponent,
    NpcDetailComponent,
    TeamComponent,
    EditableComponent,
    DialogContentExampleDialog,
    CharacterMainDialog,
    CharacterJsonDialog,
    ChargenComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    NgJsonEditorModule,
    MatButtonToggleModule,
    MatStepperModule,
    MatSliderModule,
    MatRadioModule
  ],
  entryComponents:[MatDialogModule],
  providers: [HttpClientModule,WINDOW_PROVIDERS],
  bootstrap: [AppComponent]
})
export class AppModule { }
