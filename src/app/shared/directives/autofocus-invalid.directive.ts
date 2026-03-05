import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

@Directive({
  selector: 'form[appAutofocusInvalid]',
  standalone: true,
})
export class AutofocusInvalidDirective {
  readonly appAutofocusInvalid = input(0);

  private readonly host = inject(ElementRef<HTMLFormElement>);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      if (this.appAutofocusInvalid() <= 0) {
        return;
      }

      this.focusFirstInvalidControl();
    });
  }

  focusFirstInvalidControl(): void {
    const invalidControl = this.host.nativeElement.querySelector(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid',
    ) as HTMLElement | null;
    if (!invalidControl) {
      return;
    }

    this.renderer.setProperty(invalidControl, 'tabIndex', -1);
    // Deliberate exception: focusing a specific queried descendant requires direct focus invocation.
    // Renderer2 has no scoped descendant query API and no focus primitive.
    const focusTarget = this.renderer.selectRootElement(invalidControl, true) as {
      focus?: () => void;
    } | null;
    focusTarget?.focus?.();
  }
}
