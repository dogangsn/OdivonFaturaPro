import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user.model';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
    @Input() isOpen = false;
    @Output() closeMobileMenu = new EventEmitter<void>();

    private authService = inject(AuthService);
    private userService = inject(UserService);
    lang = inject(LanguageService);
    themeService = inject(ThemeService);

    userProfile: UserProfile | null = null;

    menuItems = [
        { id: 'dashboard', icon: 'dashboard', labelKey: 'sidebar.dashboard', route: '/dashboard', isAi: false },
        { id: 'ai-assistant', icon: 'smart_toy', labelKey: 'sidebar.aiAssistant', route: '/ai-assistant', isAi: true },
        { id: 'invoices', icon: 'description', labelKey: 'sidebar.invoices', route: '/invoices', isAi: false },
        { id: 'expenses', icon: 'payments', labelKey: 'sidebar.expenses', route: '/expenses', isAi: false },
        { id: 'customers', icon: 'account_balance_wallet', labelKey: 'sidebar.customers', route: '/customers', isAi: false },
        { id: 'reports', icon: 'bar_chart', labelKey: 'sidebar.reports', route: '/reports', isAi: false },
        { id: 'settings', icon: 'settings', labelKey: 'sidebar.settings', route: '/settings', isAi: false },
    ];

    ngOnInit(): void {
        this.authService.userProfile$.subscribe(profile => {
            this.userProfile = profile;
        });
    }

    async logout() {
        await this.authService.logout();
    }
}

