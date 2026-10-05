import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AiAdvisorService, FinancialHealthSummary, AiChatMessage } from '../../core/services/ai-advisor.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './ai-assistant.component.html'
})
export class AiAssistantComponent implements OnInit {
    private aiAdvisor = inject(AiAdvisorService);
    private router = inject(Router);
    lang = inject(LanguageService);

    health: FinancialHealthSummary | null = null;
    isLoadingHealth = true;
    isThinking = false;
    userQuery = '';

    chatMessages: AiChatMessage[] = [
        {
            id: '1',
            sender: 'assistant',
            text: '',
            textKey: 'ai.welcome',
            timestamp: new Date()
        }
    ];

    async ngOnInit(): Promise<void> {
        await this.loadHealthSummary();
    }

    async loadHealthSummary(): Promise<void> {
        this.isLoadingHealth = true;
        try {
            this.health = await this.aiAdvisor.calculateFinancialHealth();
        } catch (err) {
            console.error('Failed to load financial health summary:', err);
        } finally {
            this.isLoadingHealth = false;
        }
    }

    async sendMessage(): Promise<void> {
        const text = this.userQuery.trim();
        if (!text || this.isThinking) return;

        this.chatMessages.push({
            id: Date.now().toString(),
            sender: 'user',
            text: text,
            timestamp: new Date()
        });

        this.userQuery = '';
        this.isThinking = true;

        try {
            const answer = await this.aiAdvisor.answerFinancialQuery(text);
            this.chatMessages.push({
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: answer,
                timestamp: new Date()
            });
        } catch (error) {
            this.chatMessages.push({
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: this.lang.t('ai.error'),
                timestamp: new Date()
            });
        } finally {
            this.isThinking = false;
        }
    }

    sendQuickPrompt(promptText: string): void {
        this.userQuery = promptText;
        this.sendMessage();
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
