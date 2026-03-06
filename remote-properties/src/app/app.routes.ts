import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'properties',
    pathMatch: 'full',
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./pages/property-listing.page').then(m => m.PropertyListingPage),
  },
];
