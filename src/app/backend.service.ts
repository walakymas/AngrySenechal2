import { Injectable, Type } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Logger } from './logger.service';
import { KAPCharacter } from './character';

const CHARACTERS = []

@Injectable()
export class BackendService {

    constructor(private logger: Logger) {

    }

  getAll(type: Type<any>): PromiseLike<any[]> {
    if (type === KAPCharacter) {

      return Promise.resolve<KAPCharacter[]>(CHARACTERS);
    }
    const err = new Error('Cannot get object of this type');
    this.logger.error(err);
    throw err;
  }
}