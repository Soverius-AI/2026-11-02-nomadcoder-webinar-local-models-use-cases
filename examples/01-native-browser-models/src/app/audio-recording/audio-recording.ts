import { Component, OnDestroy, output, signal } from '@angular/core';

@Component({
  selector: 'app-audio-recording',
  template: `
    <div role="group" aria-labelledby="audio-label">
      <p id="audio-label">Audio</p>
      @if (!recording()) {
        <button type="button" (click)="start()">Start recording</button>
      } @else {
        <button type="button" (click)="stop()">Stop recording</button>
        <p role="status">Recording…</p>
      }
      @if (previewUrl(); as url) {
        <audio controls [src]="url" aria-label="Recording preview"></audio>
        <button type="button" (click)="clear()">Remove recording</button>
      }
      <button
        type="button"
        name="parseName"
        (click)="parseName()"
        [disabled]="recording() || !previewUrl()"
      >
        Parse
      </button>
      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
    </div>
  `,
  styles: `
    p {
      font-size: 13px;
      font-weight: 650;
      margin: 0 0 8px;
    }
    p[role='status'],
    .error {
      font-weight: 400;
      margin-top: 8px;
    }
    audio {
      display: block;
      width: 100%;
      margin-bottom: 12px;
    }
    button {
      margin-right: 8px;
      margin-bottom: 12px;
    }
    button:focus-visible {
      outline: 3px solid #e59433;
      outline-offset: 4px;
    }
  `,
})
export class AudioRecording implements OnDestroy {
  readonly parse = output<Blob>();
  protected readonly recording = signal(false);
  protected readonly error = signal('');
  readonly #recordingBlob = signal<Blob | undefined>(undefined);
  readonly #previewUrl = signal<string | undefined>(undefined);
  protected readonly previewUrl = this.#previewUrl.asReadonly();
  #recorder: MediaRecorder | undefined;
  #stream: MediaStream | undefined;
  #chunks: Blob[] = [];

  protected async start() {
    this.error.set('');
    this.#chunks = [];
    this.#recordingBlob.set(undefined);
    this.#replacePreview(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.#stream = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.#recorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.#chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(this.#chunks, { type: recorder.mimeType || 'audio/webm' });
        this.#recordingBlob.set(blob);
        this.#replacePreview(URL.createObjectURL(blob));
        this.#releaseStream();
        this.recording.set(false);
      };
      recorder.start();
      this.recording.set(true);
    } catch (error) {
      this.#releaseStream();
      this.recording.set(false);
      this.error.set(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone permission was denied.'
          : error instanceof DOMException && error.name === 'NotFoundError'
            ? 'No microphone was found.'
            : error instanceof Error
              ? error.message
              : 'Recording failed.',
      );
    }
  }

  protected stop() {
    if (this.#recorder?.state === 'recording') this.#recorder.stop();
  }

  protected clear() {
    this.#recordingBlob.set(undefined);
    this.#replacePreview(undefined);
  }

  protected parseName() {
    const recording = this.#recordingBlob();
    if (recording) this.parse.emit(recording);
  }

  ngOnDestroy() {
    if (this.#recorder?.state === 'recording') {
      this.#recorder.onstop = null;
      this.#recorder.stop();
    }
    this.#releaseStream();
    this.#replacePreview(undefined);
  }

  #releaseStream() {
    this.#stream?.getTracks().forEach((track) => track.stop());
    this.#stream = undefined;
    this.#recorder = undefined;
  }

  #replacePreview(url: string | undefined) {
    const previous = this.#previewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.#previewUrl.set(url);
  }
}
