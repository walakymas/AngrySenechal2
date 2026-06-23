// Import the core angular services.
import { Component } from "@angular/core";
import { EventEmitter } from "@angular/core";
import { OnChanges } from "@angular/core";
import { SimpleChanges } from "@angular/core";

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

@Component({
	selector: "app-editable",
	inputs: [ "value", "enabled", "showSaveButton" ],
	outputs: [ "valueChangeEvents: valueChange" ],
	styleUrls: [ "./editable.component.css" ],
	template:
	`
		<span *ngIf="isEditing && enabled" class="editor">
			<input
				type="number"
				name="value"
				autofocus
				[(ngModel)]="pendingValue"
				(keydown.Enter)="processChanges()"
				(keydown.Meta.Enter)="processChanges()"
				(keydown.Escape)="cancel()"
			/>
			<button *ngIf="showSaveButton" mat-button type="button" (click)="processChanges()">Save</button>
			<button *ngIf="showSaveButton" mat-button type="button" (click)="cancel()">Cancel</button>
		</span>
		<span *ngIf="( ! (isEditing  && enabled) )" (click)="enabled && edit()">
			{{ value }}
		</span>
	`
})
export class EditableComponent implements OnChanges {

	public enabled!: boolean;
	public isEditing: boolean;
	public pendingValue: number;
	public showSaveButton: boolean;
	public value!: number;
	public valueChangeEvents: EventEmitter<number>;

	// I initialize the editable component.
	constructor() {
		this.isEditing = false;
		this.pendingValue = 0;
		this.showSaveButton = false;
		this.valueChangeEvents = new EventEmitter();
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (changes["enabled"] && !this.enabled) {
			this.isEditing = false;
		}
	}

	// ---
	// PUBLIC METHODS.
	// ---

	// I cancel the editing of the value.
	public cancel() : void {
        console.log(`EditableComponent.cancel`)
		this.isEditing = false;
	}


	// I enable the editing of the value.
	public edit() : void {
        if (!this.enabled) {
            return;
        }
        console.log(`EditableComponent.edit : ${this.value}`)
		this.pendingValue = Number(this.value);
		this.isEditing = true;
	}


	// I process changes to the pending value.
	public processChanges(e) : void {
        console.log(`EditableComponent.processChanges : ${this.value} ${this.pendingValue} ${JSON.stringify(e)}`)
		// If the value actually changed, emit the change but don't change the local
		// value - we don't want to break unidirectional data-flow.
		if ( Number(this.pendingValue) !== Number(this.value) ) {

			this.valueChangeEvents.emit( Number(this.pendingValue) );

		}

		this.isEditing = false;

	}

}
