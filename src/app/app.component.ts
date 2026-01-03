import { Component, OnInit } from '@angular/core';
import { CharacterService, User } from './character.service';
import { MessageService } from './message.service';
import { Logger } from './logger.service';
import { Lord, LordBase } from './lord';
import { ActivatedRoute, Router, ParamMap, Params } from '@angular/router';
import { CharacterMain, CharacterMainDialog } from './character-detail/character-detail.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subscription, interval, timer } from 'rxjs';
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
  subscription: Subscription;
  user: User;
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
    this.token = window.localStorage.getItem('token')
    this.logger.log('token:'+this.token)
  }

  ngOnInit(): void {
    this.service.getList().subscribe( l => {
      this.list = l;
      window.localStorage.setItem('list', JSON.stringify(l));      
    })
    this.service.getUser().then( u => this.setUser(u))
    this.subscription = interval(5000).subscribe(v =>
      {if ( window.localStorage.getItem('userId') ==null &&
            window.localStorage.getItem('token') !=null
      ) {
        this.service.getUser().then( u => this.setUser(u));
      }}
    );
  }

  setUser(u: User) {
    this.user = u;
    if(u.result=='fail') {
      window.localStorage.removeItem('user')
      window.localStorage.removeItem('userId')
      window.localStorage.removeItem('userName')
    } else {
      window.localStorage.setItem('user', JSON.stringify(u))
      window.localStorage.setItem('userId', ''+u.id)
      window.localStorage.setItem('userName', u.name)
    }
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
        this.snackBar.open('Dialog Cancelled','Ok',this.snackBarConfig);
      }
    });
  }

  loginBase(l) {
    this.message.add(`login as ${l.name}`)
    this.service.startLogin(l).then(token =>
      {
        window.localStorage.setItem('token',token.token);
        this.token = token.token;
        var command = 'token '+ token.id
        this.service.bot(command).subscribe(e => console.log(`sent "${command}" ${e}`));
      })
  }

  logout() {
    this.message.add("logout")
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('userId')
    window.localStorage.removeItem('user')
    window.localStorage.removeItem('userName')
    this.token = null;
    this.user = null;
  }

  navigateTo(value){
    console.log(value);
    this.router.navigate(['/character',value]);
  }

  hasToken() {
    return window.localStorage.getItem('token')!=null;
  }
}
