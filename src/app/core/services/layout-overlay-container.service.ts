import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class LayoutOverlayContainer extends OverlayContainer {
  private hostElement: HTMLElement | null = null;

  constructor(@Inject(DOCUMENT) document: any, platform: Platform) {
    super(document, platform);
  }

  setHostElement(hostElement: HTMLElement | null): void {
    this.hostElement = hostElement;
    this.attachContainerToHost();
  }

  protected _createContainer(): void {
    super._createContainer();
    this.attachContainerToHost();
  }

  private attachContainerToHost(): void {
    if (!this._containerElement) {
      return;
    }

    const nextParent = this._document.body;
    if (this._containerElement.parentNode !== nextParent) {
      nextParent.appendChild(this._containerElement);
    }
  }
}
