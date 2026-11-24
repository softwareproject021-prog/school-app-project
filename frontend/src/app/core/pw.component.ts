import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** A password box with an eye button that shows or hides what is typed. Use inside a form like an input: <app-pw name="password" [(ngModel)]="password"/> */
@Component({
  selector: 'app-pw', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PwComponent), multi: true }],
  styles: [`:host{display:block}.pwwrap{position:relative;display:block}.pwwrap input{width:100%;padding-right:46px}
    .eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;background:transparent;color:var(--muted,#5b6b86);border-radius:10px;cursor:pointer;display:grid;place-items:center}
    .eye:hover{background:var(--line,#e3e8f2);color:var(--ink,#13233f)}.eye:focus-visible{outline:2px solid var(--accent,#1b8ad6);outline-offset:1px}`],
  template: `<span class="pwwrap">
    <input [type]="show() ? 'text' : 'password'" [value]="val" (input)="typed($event)" (blur)="touched()" [disabled]="off" [attr.autocomplete]="autocomplete()" [attr.minlength]="minlength()" [attr.required]="required() ? '' : null" [attr.placeholder]="placeholder()">
    <button type="button" class="eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="show()">
      @if (show()) { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg> }
      @else { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
    </button></span>`,
})
export class PwComponent implements ControlValueAccessor {
  autocomplete = input('current-password'); minlength = input<number | null>(null); required = input(false); placeholder = input<string | null>(null);
  show = signal(false); val = ''; off = false;
  private onChange: (v: string) => void = () => {}; touched: () => void = () => {};
  writeValue(v: string | null) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touched = fn; }
  setDisabledState(d: boolean) { this.off = d; }
  typed(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}
