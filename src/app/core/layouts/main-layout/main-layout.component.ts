import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
    <div class="flex flex-col md:flex-row h-screen h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <!-- Mobile Topbar -->
      <header class="flex md:hidden items-center justify-between h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 shrink-0">
        <div class="flex items-center gap-2 text-primary">
          <img src="/odivon-violet-loop.png" alt="" class="w-7 h-7 object-contain">
          <span class="text-lg font-black tracking-tight text-slate-900 dark:text-white">Odivon <span class="text-primary">FaturaPro</span></span>
        </div>
        <button (click)="isMobileMenuOpen = !isMobileMenuOpen" class="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span class="material-symbols-outlined text-2xl">{{ isMobileMenuOpen ? 'close' : 'menu' }}</span>
        </button>
      </header>

      <!-- Sidebar Drawer / Desktop Sidebar -->
      <app-sidebar [isOpen]="isMobileMenuOpen" (closeMobileMenu)="isMobileMenuOpen = false"></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 h-[calc(100dvh-3.5rem)] md:h-screen overflow-y-auto min-h-0">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`:host { display: block; }`]
})
export class MainLayoutComponent {
    isMobileMenuOpen = false;
}
