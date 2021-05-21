import { Component, OnInit } from '@angular/core';
import { CharacterService } from './character.service';
import { MessageService } from './message.service';
import { Logger } from './logger.service';
import { Lord, LordBase } from './lord';
import { ActivatedRoute, Router, ParamMap, Params } from '@angular/router';
import { CharacterMain, CharacterMainDialog } from './character-detail/character-detail.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  list: LordBase[];
  lastChar:string;
  token:string;
  snackBarConfig = new MatSnackBarConfig();
  constructor (

    private router: Router,
    private arouter: ActivatedRoute,
    private service: CharacterService, 
    private logger: Logger,
    private message: MessageService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    ) 
  {
    this.snackBarConfig.duration = 2000;
  }

  ngOnInit(): void {
    this.service.getList().subscribe( l => this.list = l)
  }

  isPc(c: LordBase) : boolean {
    return c.type == "pc" &&  c.role != 'Lord' && c.role != 'King';
  }

  getLink(c: LordBase) : string {
    return `character/${c.name}`
  }

  isLord(c: LordBase) : boolean {
    return c && (c.name.indexOf('Lord')==0 || c.name.indexOf('Sir')==0 || c.name.indexOf('King')==0);
  }

  isLady(c: LordBase) : boolean {
    return c && c.name.indexOf('Lady')==0;
  }

  isOther(c: LordBase) : boolean {
    return !this.isLady(c) && !this.isLord(c);
  }

  newChar() {
    let main : CharacterMain;


    const dialogRef = this.dialog.open(CharacterMainDialog, {
      width: '500px',
      data: {main: null}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(JSON.stringify(result))
        this.snackBar.open('Dialog ok','Ok',this.snackBarConfig);
        this.service.newChar(result).then(c => {
          this.router.navigate(['character/'+result['name']])
          this.snackBar.open('Lord created','Ok',this.snackBarConfig);
        })        
      } else {
        this.snackBar.open('Dialog Cacelled','Ok',this.snackBarConfig);
      }
    });
  }

  loginBase(l) {
    this.message.add(`login as ${l.name}`)
    this.service.startLogin(l).then(token => 
      {
        window.localStorage.setItem('token',token);
        this.token = token;
      })
  }

  logout() {
    this.message.add("logout")
  }

  navigateTo(value){
    console.log(value);
    this.router.navigate(['/character',value]);
  }
}
