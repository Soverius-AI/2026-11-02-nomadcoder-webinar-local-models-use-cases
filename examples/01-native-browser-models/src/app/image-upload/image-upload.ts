import { Component, OnDestroy, output, signal } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  template: `
    <label for="image">Image</label>
    <input
      id="image"
      #imageInput
      type="file"
      accept="image/*"
      (change)="onImageSelected(imageInput)"
    />
    @if (previewUrl(); as url) {
      <img [src]="url" alt="Preview of the selected image" />
      <button type="button" (click)="clearImage(imageInput)">Remove image</button>
    }
    <button type="button" name="parseName" (click)="parseName()" [disabled]="!previewUrl()">
      Parse
    </button>
  `,
  styles: `
    input[type='file'] {
      display: block;
      margin-bottom: 12px;
    }
    input[type='file']:focus-visible,
    button:focus-visible {
      outline: 3px solid #e59433;
      outline-offset: 4px;
    }
    img {
      display: block;
      max-width: 100%;
      max-height: 16rem;
      object-fit: contain;
      margin-bottom: 12px;
      border: 1px solid #cad8e0;
      border-radius: 8px;
      background: #fbfcfd;
    }
    button {
      margin-right: 8px;
      margin-bottom: 12px;
    }
  `,
})
export class ImageUpload implements OnDestroy {
  readonly parse = output<File>();
  readonly #file = signal<File | undefined>(undefined);
  readonly #imageUrl = signal<string | undefined>(undefined);
  protected readonly previewUrl = this.#imageUrl.asReadonly();

  protected onImageSelected(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    this.#file.set(file);
    this.#replacePreview(URL.createObjectURL(file));
  }

  protected clearImage(input: HTMLInputElement) {
    input.value = '';
    this.#file.set(undefined);
    this.#replacePreview(undefined);
  }

  protected parseName() {
    const file = this.#file();
    if (file) this.parse.emit(file);
  }

  ngOnDestroy() {
    this.#replacePreview(undefined);
  }

  #replacePreview(url: string | undefined) {
    const previous = this.#imageUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.#imageUrl.set(url);
  }
}
