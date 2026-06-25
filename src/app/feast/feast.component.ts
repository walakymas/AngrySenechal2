import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { CharacterService } from '../character.service';
import { Logger } from '../logger.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Feast, FeastConfig, LordBase } from '../lord';
import { Subscription, interval } from 'rxjs';


@Component({
  selector: 'app-feast',
  templateUrl: './feast.component.html',
  styleUrls: ['./feast.component.css'],
})
export class FeastComponent implements OnInit {
  snackBarConfig: MatSnackBarConfig;
  subscription: Subscription;
  list: LordBase[];
  notseatable = true;
  selectedGuest: number = null;
  selectedSeat: string = null;
  
  feastConfig : FeastConfig;
  feast : Feast;
  constructor(
    private route: ActivatedRoute,
    private service: CharacterService,
    private logger: Logger,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  
  ) {
      this.snackBarConfig = new MatSnackBarConfig();
      this.snackBarConfig.duration = 2000;
  }

  ngOnInit(): void {
    console.log('FeastComponent ngOnInit');
    this.service.getList().subscribe( l => {
      this.list = l;
      this.service.getFeastConfig().subscribe( l => {
        this.feastConfig = l;
        this.subscription = interval(60000).subscribe(v => this.loadFeast());
        this.loadFeast();
      });
    });
  }

  loadFeast(): void {
    console.log('loadFeast')
    this.service.getFeast().subscribe( l => this.setFeast(l));
  }

  setFeast(f:Feast) {
    this.feast = f;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  getCards(pid:number) {
      this.feast.data.participiants[pid].rounds[this.feast.data.round];
  }

  getBase(cid:number): LordBase {
    if (!this.list) {
      this.logger.error('FeastComponent.getBase: Lord with id ' + cid + ' not found (null list)');
      return null;
    }
    var lord = this.list.find(l => l.id == cid);
    if (!lord) {
      this.logger.error('FeastComponent.getBase: Lord with id ' + cid + ' not found');
      return null;
    }
    return lord;
  }
    selectGuest(cid: number): void {
        this.selectedGuest = cid
        this.notseatable = this.selectedGuest === null || this.selectedSeat === null;
    }
    selectSeat(s: string): void {
        this.selectedSeat = s;
        this.notseatable = this.selectedGuest === null || this.selectedSeat === null;
    }
    seatGuest(): void {
        if (this.notseatable) {
            this.snackBar.open('Please select a guest and a seat', 'Close', this.snackBarConfig);
            return;
        }
        this.service.seatGuest(this.selectedGuest, this.selectedSeat).subscribe(
            (f) => this.setFeast(f));
        this.snackBar.open('Guest seated', 'Close', this.snackBarConfig);
        this.selectedGuest = null;
        this.notseatable = true;
    }
    setRounds(rounds: number): void {
        if (this.feast.data.state !== 'init') {
            this.snackBar.open('Cannot set rounds after initialization.', 'Close', this.snackBarConfig);
            return;
        }
        this.service.setRounds(rounds).subscribe(
            (f) => this.setFeast(f));
        this.snackBar.open('Rounds set to ' + rounds, 'Close', this.snackBarConfig);
    }
    setAction(action: string, pid: number) : void {
/*
        if (this.feast.data.state !== 'feast') {
            this.snackBar.open('Cannot set action after initialization.', 'Close', this.snackBarConfig);
            return;
        }
*/
        this.service.setAction(action, pid).subscribe(
            (f) => this.setFeast(f));
    }
    getAction(pid: number) : string {
        try {
          return this.feast.data.participiants[''+pid]['rounds'][this.feast.data.round]['action'];
        } catch (error) {
          this.logger.warn('part:'+pid+","+JSON.stringify(this.feast.data.participiants));
          this.logger.warn('part:'+JSON.stringify(this.feast.data.participiants[''+pid]));
          return 'NA';
        }
    }

    isHostCard(card: string) : boolean {
      //this.logger.log("isHostCard: "+card+" "+JSON.stringify(this.feastConfig[card]));
      if (this.feastConfig[card] && this.feastConfig[card].tags && this.feastConfig[card].tags.indexOf('host') >= 0) {
        return true;
      }
      return false;
    }

    isInactive(card: string, cards: string[], significant) {
      if (this.isHostCard(card)) {
        return false;
      }
      for (var c of cards) {
        if (this.isHostCard(c)) {
          //this.logger.log("isInactive: "+card+" is inactive because "+c+" is host card");
          return true;
        }
      }
      return false;
    }

    nextState() {
        this.service.nextState().subscribe((f) => this.setFeast(f));
        this.snackBar.open('Next state after '+this.feast.data.state, 'Open', this.snackBarConfig);
    }
}
