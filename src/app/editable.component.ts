// Import the core angular services.
import { Component } from "@angular/core";
import { EventEmitter } from "@angular/core";

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

@Component({
	selector: "app-editable",
	inputs: [ "value" ],
	outputs: [ "valueChangeEvents: valueChange" ],
	styleUrls: [ "./editable.component.css" ],
	template:
	`
		<span *ngIf="isEditing" class="editor">
			<input
				type="number"
				name="value"
				autofocus
				[(ngModel)]="pendingValue"
				(keydown.Enter)="processChanges()"
				(keydown.Meta.Enter)="processChanges()"
				(keydown.Escape)="cancel()"
			/>
		</span>
		<span *ngIf="( ! isEditing )" (click)="edit()">
			{{ value }}
		</span>
	`
})
export class EditableComponent {

	public isEditing: boolean;
	public pendingValue: number;
	public value!: number;
	public valueChangeEvents: EventEmitter<number>;

	// I initialize the editable component.
	constructor() {
		this.isEditing = false;
		this.pendingValue = 0;
		this.valueChangeEvents = new EventEmitter();
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
        console.log(`EditableComponent.edit : ${this.value}`)
		this.pendingValue = this.value;
		this.isEditing = true;
	}


	// I process changes to the pending value.
	public processChanges(e) : void {
        console.log(`EditableComponent.processChanges : ${this.value} ${this.pendingValue} ${JSON.stringify(e)}`)
		// If the value actually changed, emit the change but don't change the local
		// value - we don't want to break unidirectional data-flow.
		if ( this.pendingValue !== this.value ) {

			this.valueChangeEvents.emit( Number(this.pendingValue) );

		}

		this.isEditing = false;

	}

}