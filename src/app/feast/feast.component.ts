import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Feast, FeastConfig, FeastReply, LordBase } from '../lord';
import { Subscription, interval } from 'rxjs';
import { describeRoll } from './feast-util';

const ADMIN = 1;
const POLL_MS = 15000;

@Component({
    selector: 'app-feast',
    templateUrl: './feast.component.html',
    styleUrls: ['./feast.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FeastComponent implements OnInit, OnDestroy {
  list: LordBase[] = [];
  feastConfig: FeastConfig;
  feast: Feast | null = null;
  loaded = false;
  lastRoll = '';
  private subscription: Subscription;

  constructor(private service: CharacterService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.service.getList().subscribe(l => {
      this.list = l || [];
      this.service.getFeastConfig().subscribe(c => {
        this.feastConfig = c;
        this.loadFeast();
        this.subscription = interval(POLL_MS).subscribe(() => this.loadFeast());
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadFeast(): void {
    this.service.getFeast().subscribe(f => {
      this.feast = f;
      this.loaded = true;
    });
  }

  // The answer of a feast call (null when the API refused it: the reason is already shown)
  updated(reply: FeastReply | null): void {
    if (!reply || !reply.data) {
      return;
    }
    this.feast = reply;
    if (reply.rolled) {
      this.lastRoll = describeRoll(reply.rolled);
      this.snackBar.open(this.lastRoll, 'Ok', { duration: 6000 });
    }
  }

  private get user(): any {
    try {
      return JSON.parse(window.localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  }

  get loggedIn(): boolean {
    const token = this.service.getToken();
    return !!token && token !== 'null' && !!this.user.did;
  }

  get isHost(): boolean {
    return this.loggedIn && (+this.user.rights & ADMIN) === ADMIN;
  }

  // The characters the logged in user may play with: his own, the host's all player characters
  get mine(): number[] {
    if (!this.loggedIn) {
      return [];
    }
    return this.list
      .filter(l => l.type === 'pc' && (this.isHost || ('' + l.memberid) === '' + this.user.did))
      .map(l => l.id);
  }
}
