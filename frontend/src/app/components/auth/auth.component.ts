import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials, RegisterCredentials } from '../../models';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  mode: 'login' | 'register' = 'login';
  loading = false;
  showPassword = false;
  errorMsg = '';
  successMsg = '';

  loginData: LoginCredentials = { username: '', password: '' };
  registerData: RegisterCredentials = { username: '', email: '', password: '' };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onLogin(): void {
    this.clearMessages();
    this.loading = true;
    this.authService.login(this.loginData).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }

  onRegister(): void {
    this.clearMessages();
    this.loading = true;
    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.successMsg = 'Account created! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
