import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-blue-deep">Dashboard</h1>
      <p class="text-gray-600 mt-4">Bienvenido a Aliada Salud</p>
    </div>
  `
})
export class DashboardComponent {}
