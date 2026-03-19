import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loader',
  templateUrl: './global-loader.component.html',
  styleUrls: ['./global-loader.component.scss'],
})
export class GlobalLoaderComponent {
  readonly state$ = this.loadingService.state$;

  constructor(private loadingService: LoadingService) {}
}
