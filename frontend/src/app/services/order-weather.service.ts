import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, CreateOrderDto, Order, ForecastData, WeatherData } from '../models';

// ─── Order Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/${id}`);
  }

  create(order: CreateOrderDto): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.baseUrl, order);
  }

  update(id: string, updates: Partial<Order>): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/${id}`, updates);
  }

  delete(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`);
  }
}

// ─── Weather Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly baseUrl = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string): Observable<ApiResponse<WeatherData>> {
    return this.http.get<ApiResponse<WeatherData>>(`${this.baseUrl}/current`, {
      params: { city }
    });
  }

  getForecast(city: string): Observable<ApiResponse<ForecastData>> {
    return this.http.get<ApiResponse<ForecastData>>(`${this.baseUrl}/forecast`, {
      params: { city }
    });
  }
}
