import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { AuthComponent }      from './components/auth/auth.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent }  from './components/products/products.component';
import { OrdersComponent }    from './components/orders/orders.component';

const routes: Routes = [
  { path: 'auth/login',    component: AuthComponent },
  { path: 'auth/register', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'products',  component: ProductsComponent,  canActivate: [authGuard] },
  { path: 'orders',    component: OrdersComponent,    canActivate: [authGuard] },
  { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
