import { Component, OnInit, Input } from '@angular/core';
import { Lord, LordData } from '../lord';
import { CharacterDetailComponent } from '../character-detail/character-detail.component';

@Component({
  selector: 'app-npc-detail2',
  templateUrl: './npc-detail2.component.html',
  styleUrls: ['./npc-detail2.component.css']
})
export class NpcDetail2Component implements OnInit {
  @Input("char") char: Lord;
  @Input("parent") parent: CharacterDetailComponent;
  chivalry: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  public isEq(s1: string, s2:string):boolean{
    let result = s1==s2;
    return result;
  }

  isMarked(name : string)  {
    return this.char.marks && this.char.marks.indexOf(name)>=0;
  }

  hasUser() : boolean {
    return this.parent.hasUser();
  }

  toJson(char: Lord): string {
    return JSON.stringify(char);
  }

  isChivalry(name: string): boolean {
    return this.parent.isChivalry(name);
  }

  isVirtue(name: string): boolean {
    return this.parent.isVirtue(name);
  }

  getTrait(name: string): number {
    return this.parent.getTrait(name);
  }
}
