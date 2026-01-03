import { Component, OnInit, Input } from '@angular/core';
import { LordData } from '../lord';

@Component({
  selector: 'app-npc-detail2',
  templateUrl: './npc-detail2.component.html',
  styleUrls: ['./npc-detail2.component.css']
})
export class NpcDetail2Component implements OnInit {
  @Input("char") char: LordData;

  constructor() { }

  ngOnInit(): void {
  }

  public isEq(s1: string, s2:string):boolean{
    let result = s1==s2;
    return result;
  }

}
