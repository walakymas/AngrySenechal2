import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { CharacterService } from '../character.service';
import { Logger } from '../logger.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Feast } from '../lord';

@Component({
  selector: 'app-feast',
  templateUrl: './feast.component.html',
  styleUrls: ['./feast.component.css']
})
export class FeastComponent implements OnInit {
  snackBarConfig: MatSnackBarConfig;

  feast : Feast;
  constructor(
    private route: ActivatedRoute,
    private service: CharacterService,
    private location: Location,
    private logger: Logger,
    private snackBar: MatSnackBar,
    public dialog: MatDialog

  ) {
      this.snackBarConfig = new MatSnackBarConfig();
      this.snackBarConfig.duration = 2000;
  }

  ngOnInit(): void {
  }

}
