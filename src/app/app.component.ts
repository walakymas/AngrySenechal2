import { Component, OnInit } from '@angular/core';
import { CharacterService } from './character.service';
import { Logger } from './logger.service';
import { Lord, LordBase } from './lord';
import { ActivatedRoute, Router, ParamMap, Params } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  list: LordBase[];
  lastChar:string;
  constructor (

    private router: Router,
    private service: CharacterService, 
    private logger: Logger,
    ) {
    
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

  navigateTo(value){
    console.log(value);
    this.router.navigate(['/character',value]);
  }
}
