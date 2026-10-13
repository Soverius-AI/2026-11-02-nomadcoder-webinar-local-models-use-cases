import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
@Component({
  selector: 'app-root',
  template: `
    <label for="prompt">Prompt</label>
    <textarea id="prompt" [formField]="promptForm.prompt" rows="5" spellcheck="false"></textarea>

    <button (click)="handlePrompt()">Translate</button>

    <p>{{ response() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 40rem;
      margin: 2.5rem auto;
      padding: 0 1.25rem;
    }
    textarea {
      display: block;
      min-height: 8rem;
    }
  `,
  imports: [FormField],
})
export class App {
  prompt = signal({ prompt: 'What is the capital of Austria?' });
  promptForm = form(this.prompt);
  response = signal('');

  async handlePrompt() {}
}
