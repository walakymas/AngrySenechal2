import { Injectable, OnInit } from '@angular/core';

import { Lord, LordBase } from './lord';
import { Base } from './base';
import { Logger } from './logger.service';
import { environment } from './../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { waitForAsync } from '@angular/core/testing';



@Injectable({ providedIn: 'root' })
export class CharacterService {
  private characters: {} = {};

  private characterUrl = 'json';  // URL to web api
  private base : Promise<Base>;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private logger: Logger) {}

  setMark(mark:string, mid:string, set:boolean): Promise<Lord>{
    return this.http.post<Lord>(`${environment.url}mark`,
      new HttpParams()
      .set('id', mid)
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
      this.base = this.http.get<Base>(`${environment.url}base`).pipe(
        tap(_ => this.logger.log(`fetched base `)),
        catchError(this.handleError<Base>(`getBase`))
      ).toPromise()
    }
    return this.base;
  }

  getLord(id: number): Observable<Lord> {
    const url = `${environment.url}${this.characterUrl}?id=${id}`;
    return this.http.get<Lord>(url).pipe(
      tap(_ => this.logger.log(`fetched lord id=${id}`)),
      catchError(this.handleError<Lord>(`getLord id=${id}`))
    );
  }

  getList(): Observable<LordBase[]> {
    return this.http.get<LordBase[]>(`${environment.url}list`).pipe(
      tap(_ => this.logger.log(`fetched lord list`)),
      catchError(this.handleError<LordBase[]>(`getList`))
    );
  }

  getLordByName(name: string): Observable<Lord> {
    const url = `${environment.url}${this.characterUrl}?ch=${name}`;
    return this.http.get<Lord>(url).pipe(
      tap(_ => this.logger.log(`fetched lord name=${name}`)),
      catchError(this.handleError<Lord>(`getLord id=${name}`))
    );
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
