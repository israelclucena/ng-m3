import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`:host { display: block; height: 100%; }`],
})
export class App {
  protected title = 'remote-properties';
}
