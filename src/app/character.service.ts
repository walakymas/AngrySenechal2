import { Injectable, OnInit,Inject } from '@angular/core';

import { Lord, LordBase, LordData} from './lord';
import { CharacterMain} from './character-detail/character-detail.component';
import { Base } from './base';
import { Logger } from './logger.service';
import { environment } from './../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap,timeout } from 'rxjs/operators';
import { waitForAsync } from '@angular/core/testing';
import { GameEvent } from './character-detail/character-detail.component';
import { Router } from '@angular/router';
import { WINDOW } from './windows';
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
      if (this.window.location.protocol=='https:') {
        this.url = "https://"+this.window.location.hostname+"/backend/";
      } else {
        this.url = this.window.location.protocol+"//"+this.window.location.hostname+":8080/";
      }
      console.log('uri:'+this.url);
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
      .set('username', 'CaptainHook')
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

  startLogin(l:LordBase): Promise<string> {
    const url = this.url+`login`;
    return this.http.post<string>(url,
      new HttpParams()
      .set('dbid', ''+l.id),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).pipe(
        timeout(2000),
        tap(_ => this.logger.log(`login first phase lord name=${l.id}`)),
        catchError(this.handleError<string>(`getLord id=${l.id}`))
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
}
