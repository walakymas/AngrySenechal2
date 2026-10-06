import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from './../character.service';
import { Lord } from './../lord';

@Component({
    selector: 'app-npc-detail',
    templateUrl: './npc-detail.component.html',
    styleUrls: ['./npc-detail.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NpcDetailComponent implements OnInit {
  @Input("dbid") dbid: number=1;
  npc : Lord;

  constructor(
    private service: CharacterService,
  ) { }

  ngOnInit(): void {
    this.service.getLord(this.dbid).subscribe( l => this.setNpc(l));
  }

  public isEq(s1: string, s2:string):boolean{
    let result = s1==s2;
    return result;
  }

  setNpc(l: Lord) {
    this.npc = l;
  }

  isDeceased() {
    return 'Deceased' in this.npc.char['main'];
  }

}
