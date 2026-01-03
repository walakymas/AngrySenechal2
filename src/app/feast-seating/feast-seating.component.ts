import { Component, OnInit, Input } from '@angular/core';
import { LordBase } from '../lord';
import { Logger } from '../logger.service';

@Component({
  selector: 'feast-seating',
  templateUrl: './feast-seating.component.html',
  styleUrls: ['./feast-seating.component.css']
})
export class FeastSeatingComponent implements OnInit {
  @Input() filter: string = '';
  @Input() participiants: any;
  list: LordBase[];

  constructor(
    private logger: Logger,
  ) { }

  
  getBase(cid:number): any {
    if (!this.list) {
      this.list = JSON.parse(window.localStorage.getItem('list'));
    }
    var lord = this.list.find(l => l.id == cid);
    if (!lord) {
      this.logger.error('FeastComponent.getBase: Lord with id ' + cid + ' not found');
      return { url: 'default-image-url.png', name: 'Unknown' };
    }
    return lord;
  }
  ngOnInit(): void {
  }
  fallback(event: any): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://raw.githubusercontent.com/walakymas/AngrySenechal2/refs/heads/spring/src/assets/question.png'; // vagy egy elérhető kép URL-je
    console.error('Image failed to load, using fallback image.');
  }

}
