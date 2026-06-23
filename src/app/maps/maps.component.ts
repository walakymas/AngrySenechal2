import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CharacterService, MapEntry } from '../character.service';
import { MapEditDialog } from '../admin/maps-admin.component';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {
  maps: MapEntry[] = [];
  categories: string[] = [];
  grouped: { [cat: string]: MapEntry[] } = {};
  selectedCategory: string = '';

  currentPreview: MapEntry | null = null;
  previewStyle: any = {};
  keepPreviewFlag = false;

  constructor(private service: CharacterService, public dialog: MatDialog, private snack: MatSnackBar) { }
  ngOnInit(): void {
    this.loadMaps();
  }

  loadMaps() {
    this.service.getMaps().subscribe(m => this.setMaps(m));
  }

  setMaps(m: MapEntry[]) {
    const previousCategory = this.selectedCategory;
    this.maps = m;
    // ensure ord is number
    this.maps.forEach(x => x.ord = x.ord ? +x.ord : 0);
    this.maps.sort((a, b) => (a.ord || 0) - (b.ord || 0));
    this.grouped = {};
    for (let mm of this.maps) {
      const c = mm.category || 'default';
      if (!(c in this.grouped)) this.grouped[c] = [];
      this.grouped[c].push(mm);
    }
    this.categories = Object.keys(this.grouped);
    if (this.categories.length > 0) {
      this.selectedCategory = this.categories.includes(previousCategory) ? previousCategory : this.categories[0];
    }
  }

  selectCategory(c: string) {
    this.selectedCategory = c;
  }

  editMap(event: MouseEvent, map: MapEntry) {
    event.stopPropagation();
    this.currentPreview = null;

    const dialogRef = this.dialog.open(MapEditDialog, { data: { map: { ...map } } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateMap(result).subscribe(() => {
          this.snack.open('Map updated', 'OK', { duration: 2000 });
      this.loadMaps();
    }, () => {
          this.snack.open('Could not update map', 'OK', { duration: 3000 });
    });
  }
    });
  }

  showPreview(e: MouseEvent, m: MapEntry) {
    this.currentPreview = m;
    this.keepPreviewFlag = false;
    const target = (e.target as HTMLElement).closest('.map-item') as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // available space to the right and left and below
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;
    const spaceBelow = vh - rect.top;
    const spaceAbove = rect.bottom;

    // default preview size
    let pw = 600;
    let ph = 400;

    // adjust size to available width/height
    if (spaceRight > 300) {
      // place to the right
      const maxW = Math.min(pw, spaceRight - 20);
      pw = maxW > 200 ? maxW : Math.min(pw, spaceLeft - 20);
    } else {
      // place to left if not enough space on right
      pw = Math.min(pw, spaceLeft - 20);
    }
    // height adjust
    ph = Math.min(ph, spaceBelow - 20);
    if (ph < 150) ph = Math.min(300, vh - 40);

    // position calc
    let left = rect.right + 10;
    if (spaceRight < 300) {
      left = rect.left - pw - 10;
      if (left < 0) left = 10;
    }
    let top = rect.top;
    if (top + ph > vh) top = Math.max(10, vh - ph - 10);

    this.previewStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${pw}px`,
      height: `${ph}px`,
      display: 'block'
    };
  }

  keepPreview() {
    this.keepPreviewFlag = true;
  }

  hidePreview() {
    if (!this.keepPreviewFlag) {
      this.currentPreview = null;
    }
  }

}

