import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'CartCheck – Lista de supermercado',
    loadComponent: () =>
      import('./features/shopping-list/components/shopping-list-page/shopping-list-page').then(
        (m) => m.ShoppingListPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
