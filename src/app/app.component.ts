import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          this.authService.storeSession({ user });
        },
        error: () => {
          // Handled by auth interceptor if it is a 401
        }
      });
    }
  }
}
