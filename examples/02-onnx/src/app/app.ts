import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { disabled, form, FormField, maxLength } from '@angular/forms/signals';
import { MODEL_ID, type ChatMessage, type WorkerRequest, type WorkerResponse } from './protocol';

@Component({
  selector: 'app-root',
  imports: [FormField],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly modelId = MODEL_ID;
  readonly state = signal<'idle' | 'loading' | 'ready' | 'generating' | 'error'>('idle');
  readonly error = signal('');
  readonly files = signal<{ file: string; percent: number | null; done: boolean }[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly reply = signal('');
  readonly draft = signal({ prompt: 'Hi! What can you help me with?' });
  readonly promptForm = form(this.draft, (path) => {
    disabled(path.prompt, () => this.state() !== 'ready');
    maxLength(path.prompt, 2000);
  });
  readonly status = computed(
    () =>
      ({
        idle: 'Not loaded',
        loading: 'Preparing Gemma…',
        ready: 'Ready to chat',
        generating: 'Gemma is replying…',
        error: 'Could not load Gemma',
      })[this.state()],
  );
  readonly completedFiles = computed(() => this.files().filter((file) => file.done).length);
  private worker?: Worker;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  load() {
    if (!['idle', 'error'].includes(this.state())) return;
    this.error.set('');
    if (!('gpu' in navigator)) {
      this.error.set(
        'WebGPU is not available. Open this demo in desktop Chrome on a supported device.',
      );
      this.state.set('error');
      return;
    }
    this.state.set('loading');
    this.files.set([]);
    this.worker?.terminate();
    try {
      this.worker = new Worker(new URL('./app.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => this.receive(data);
      this.worker.onerror = () => {
        if (this.state() === 'generating') this.restorePrompt();
        this.reply.set('');
        this.error.set('The model worker stopped. Reload Gemma and try again.');
        this.state.set('error');
        this.worker?.terminate();
      };
      this.post({ type: 'load' });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
      this.state.set('error');
    }
  }

  send(event: Event) {
    event.preventDefault();
    const prompt = this.draft().prompt.trim();
    if (this.state() !== 'ready' || !prompt || this.promptForm().invalid()) return;
    this.error.set('');
    this.reply.set('');
    const messages: ChatMessage[] = [...this.messages(), { role: 'user', content: prompt }];
    this.messages.set(messages);
    this.draft.set({ prompt: '' });
    this.state.set('generating');

    this.post({ type: 'generate', messages });
  }

  clearChat() {
    if (this.state() === 'generating') return;
    this.messages.set([]);
    this.reply.set('');
    this.error.set('');
  }

  private post(message: WorkerRequest) {
    this.worker?.postMessage(message);
  }

  private receive(message: WorkerResponse) {
    switch (message.type) {
      case 'file':
        this.files.update((files) => {
          const previous = files.find((file) => file.file === message.file);
          const updated = {
            file: message.file,
            percent:
              message.percent === null ? (previous?.percent ?? null) : Math.round(message.percent),
            done: message.done,
          };
          return previous
            ? files.map((file) => (file.file === message.file ? updated : file))
            : [...files, updated];
        });
        break;
      case 'ready':
        this.state.set('ready');
        break;
      case 'token':
        this.reply.update((text) => text + message.text);
        break;
      case 'done':
        if (this.reply().trim()) {
          this.messages.update((messages) => [
            ...messages,
            { role: 'assistant', content: this.reply() },
          ]);
        } else {
          this.restorePrompt();
          this.error.set('Gemma returned no text. Try another prompt.');
        }
        this.reply.set('');
        this.state.set('ready');
        break;
      case 'error':
        this.error.set(message.error);
        if (this.state() === 'generating') {
          this.restorePrompt();
          this.reply.set('');
          this.state.set('ready');
        } else {
          this.state.set('error');
          this.worker?.terminate();
        }
    }
  }

  private restorePrompt() {
    this.draft.set({ prompt: this.messages().at(-1)?.content ?? '' });
    this.messages.update((messages) => messages.slice(0, -1));
  }
}
