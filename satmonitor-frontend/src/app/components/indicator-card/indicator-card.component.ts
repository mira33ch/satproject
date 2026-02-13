import { Component, Input } from '@angular/core';
import { IndicatorDto } from 'src/app/http_services/indicator/indicator.service';

@Component({
  selector: 'app-indicator-card',
  templateUrl: './indicator-card.component.html',
  styleUrls: ['./indicator-card.component.css']
})
export class IndicatorCardComponent {
 @Input() item!: IndicatorDto;
}
