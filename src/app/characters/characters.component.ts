import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-characters',
    templateUrl: './characters.component.html',
    styleUrls: ['./characters.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CharactersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
