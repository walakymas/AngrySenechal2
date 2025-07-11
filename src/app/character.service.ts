import { Injectable, OnInit,Inject } from '@angular/core';

import { Lord, LordBase, LordData} from './lord';
import { CharacterMain} from './character-detail/character-detail.component';
import { Base } from './base';
import { Logger } from './logger.service';
import { environment } from './../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap,timeout } from 'rxjs/operators';
import { GameEvent } from './character-detail/character-detail.component';
import { WINDOW } from './windows';

export class User {
  name: string;
  id: number;
  did: number;
  expires: string;
  result: string;
  rights: number;
}

export class Token {
  token: string;
  id: number;
}
export class TokenAll {
  token: string;
  id: number;
  created:string;
  modified:string;
  expires:string
  cid:number
  tokenstate:number
}

export class CheckAll {
  id:number;
  created: string;
  modified:string;
  character:number;
  command:string;
  result;
  name: string;
}

export class Player {
  cid: number;
  created:string;
  modified:string;
  playerstate: number;
  playerrights:number   ;
  did:number;
  name: string;
  character: number ;
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private characters: {} = {};

  private characterUrl = 'json';  // URL to web api
  private base : Promise<Base>;
  private url = environment.url;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private logger: Logger
    ,@Inject(WINDOW) private window: Window
    ) {
      console.log('protocol:'+this.window.location.protocol);
      this.url = this.window.location.protocol+"//"+this.window.location.hostname+"/backend/";
      console.log('uriii:'+this.url);
    }

  getUrl() {
    console.log('geturi:'+this.url);
    return this.url;
  }

  setMark(mark:string, id:string, set:boolean): Promise<Lord>{
    return this.http.post<Lord>(this.url+`mark`,
      new HttpParams()
      .set('id', id)
      .set('set', ''+set)
      .set('mark', mark).toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  getBase(): Promise<Base>{
    if (!this.base) {
      this.base = this.http.get<Base>(this.url+`base`).pipe(
        tap(_ => this.logger.log(`fetched base `)),
        catchError(this.handleError<Base>(`getBase`))
      ).toPromise()
    }
    return this.base;
  }

  modifyProp(dbid:number, prop:string, value:string) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`modify`,
      new HttpParams()
      .set('id',  ''+dbid)
      .set('token',  this.getToken())
      .set(prop,value).toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  modify(l:Lord) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`modify`,
      new HttpParams()
      .set('id',  l.char['dbid'])
      .set('token',  this.getToken())
      .set('json', JSON.stringify( l.char)).toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  modifyChar(char) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`modify`,
      new HttpParams()
      .set('id',  char['dbid'])
      .set('token',  this.getToken())
      .set('json', JSON.stringify( char)).toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  newChar(main: CharacterMain) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`newchar`,
      new HttpParams()
      .set('json', JSON.stringify(main))
      .toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  main(l:Lord, m: CharacterMain) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`modify`,
      new HttpParams()
      .set('id',  l.char['dbid'])
      .set('name', m.name)
      .set('shortName', m.shortName)
      .set('role', m.role)
      .set('url', m.url)
      .set('description', m.description)
      .set('longdescription', m.longdescription)
      .toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }


  event(l:Lord, event : GameEvent) : Promise<Lord>{
    return this.http.post<Lord>(this.url+`event`,
      new HttpParams()
      .set('dbid',  l.char['dbid'])
      .set('year', ''+event.year)
      .set('glory', ''+event.glory)
      .set('eid', ''+event.id)
      .set('description', event.description)
      .toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }

  getUser() : Promise<User>{
    return this.http.post<User>(this.url+`user`,
      new HttpParams()
      .set('token',  this.getToken())
      .toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`getUser `)),
      catchError(this.handleError<User>(`getUser error`))
    ).toPromise();
  }


  getLord(id: number): Observable<Lord> {
    const url = this.url+`${this.characterUrl}?id=${id}`;
    return this.http.get<Lord>(url).pipe(
      tap(_ => this.logger.log(`fetched lord id=${id}`)),
      catchError(this.handleError<Lord>(`getLord id=${id}`))
    );
  }

  getList(): Observable<LordBase[]> {
    return this.http.get<LordBase[]>(this.url+`list`).pipe(
      tap(_ => this.logger.log(`fetched lord list`)),
      catchError(this.handleError<LordBase[]>(`getList`))
    );
  }

  bot(command : string): Observable<String> {
    return this.http.post<String>(environment.hook,
      new HttpParams()
      .set('username', 'Captain Hook')
      .set('avatar_url','https://senechalweb.duckdns.org/attachments/hook.png')
      .set('content',environment.prefix+command).toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`hook pulled`)),
      catchError(this.handleError<String>(`getList`))
    );
  }

  getTeam(): Observable<LordData[]> {
    return this.http.get<LordData[]>(this.url+`players`).pipe(
      tap(_ => this.logger.log(`fetched lord list`)),
      catchError(this.handleError<LordData[]>(`getTeam`))
    );
  }

  getLordByName(name: string): Observable<Lord> {
    const url = this.url+`${this.characterUrl}?ch=${name}`;
    return this.http.get<Lord>(url).pipe(
      tap(_ => this.logger.log(`fetched lord name=${name}`)),
      catchError(this.handleError<Lord>(`getLord id=${name}`))
    );
  }

  startLogin(l:LordBase): Promise<Token> {
    const url = this.url+`token`;
    return this.http.post<Token>(url,
      new HttpParams()
      .set('cid', ''+l.id),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
        timeout(2000),
        tap(_ => this.logger.log(`login first phase lord name=${l.id}`)),
        catchError(this.handleError<Token>(`token id=${l.id}`))
    ).toPromise();
  }


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.logger.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getToken() {
    return this.window.localStorage.getItem('token');
  }


  getPlayerList(): Observable<Player[]> {
    return this.http.get<Player[]>(this.url+`adminList?table=player`).pipe(
      tap(_ => this.logger.log(`fetched player list`)),
      catchError(this.handleError<Player[]>(`getPlayerList`))
    );
  }

  getTokenList(): Observable<TokenAll[]> {
    return this.http.get<TokenAll[]>(this.url+`adminList?table=tokens`).pipe(
      tap(_ => this.logger.log(`fetched player list`)),
      catchError(this.handleError<TokenAll[]>(`getPlayerList`))
    );
  }

  getCheckList(): Observable<CheckAll[]> {
    return this.http.get<CheckAll[]>(this.url+`adminList?table=checks`).pipe(
      tap(_ => this.logger.log(`fetched player list`)),
      catchError(this.handleError<CheckAll[]>(`getPlayerList`))
    );
  }

  updatePlayer(p:Player): Promise<Player> {
    const url = this.url+`updatePlayer`;
    console.log('updatePlayer:'+p.did)
    return this.http.post<Player>(url,
      new HttpParams()
      .set('cid', ''+p.cid)
      .set('name', ''+p.name)
      .set('fake', 'fake')
      .set('did', p.did)
      .set('character', ''+p.character),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
        timeout(2000),
        tap(_ => this.logger.log(`login first phase lord name=${p.cid}`)),
        catchError(this.handleError<Player>(`token id=${p.cid}`))
    ).toPromise();
  }

  updateChar(p:LordBase): Promise<Lord> {
    return this.http.post<Lord>(this.url+`modify`,
      new HttpParams()
      .set('id',  ''+p.id)
      .set('token',  this.getToken())
      .set('name', ''+p.name)
      .set('memberid', ''+p.memberid)
      .set('player', ''+p.player)
      .set('role', ''+p.role)
      .set('type', ''+p.type),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
      tap(_ => this.logger.log(`set mark `)),
      catchError(this.handleError<Lord>(`setMark`))
    ).toPromise();
  }


}
