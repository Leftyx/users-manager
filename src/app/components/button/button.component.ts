import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  @Input() text: string = '';
  @Input() icon?: string;

  @Output() onClick = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  public onButtonClick = () => {
    this.onClick.emit();
  }
}
