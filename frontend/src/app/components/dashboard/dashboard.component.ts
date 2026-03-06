import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService } from '../../services/auth.service';
import { WeatherService, OrderService } from '../../services/order-weather.service';
import { ProductActions, selectProductsTotal } from '../../store/product.store';
import { WeatherData, ForecastDay, Order, User } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = this.authService.currentUser;
  today = new Date();

  totalProducts$ = this.store.select(selectProductsTotal);

  orders: Order[] = [];
  totalRevenue = 0;
  pendingOrders = 0;

  weather: WeatherData | null = null;
  forecast: ForecastDay[] = [];
  weatherLoading = false;
  weatherError = '';
  cityInput = 'London';

  constructor(
    private authService: AuthService,
    private weatherService: WeatherService,
    private orderService: OrderService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadProducts({}));
    this.fetchWeather();
    this.loadOrders();
  }

  fetchWeather(): void {
    if (!this.cityInput.trim()) return;
    this.weatherLoading = true;
    this.weatherError = '';

    this.weatherService.getCurrentWeather(this.cityInput).subscribe({
      next: (res) => {
        this.weather = res.data || null;
        this.weatherLoading = false;
      },
      error: (err) => {
        this.weatherError = err.error?.message || 'Could not load weather data';
        this.weatherLoading = false;
      }
    });

    this.weatherService.getForecast(this.cityInput).subscribe({
      next: (res) => { this.forecast = res.data?.forecast || []; },
      error: () => { this.forecast = []; }
    });
  }

  loadOrders(): void {
    this.orderService.getAll().subscribe({
      next: (res) => {
        this.orders = (res.data as Order[]) || [];
        this.totalRevenue = this.orders.reduce((sum, o) => sum + o.totalAmount, 0);
        this.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
      },
      error: () => {}
    });
  }

  getUserInitial(): string {
    return (this.user?.username?.[0] || 'U').toUpperCase();
  }
}
