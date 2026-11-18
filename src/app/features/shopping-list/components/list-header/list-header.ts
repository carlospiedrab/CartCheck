import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-list-header',
  imports: [MatIconModule, MatProgressBarModule],
  host: { class: 'block' },
  template: `
    <header class="flex flex-col gap-3.5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary"
            aria-hidden="true"
          >
            <mat-icon class="size-[22px]! text-[22px]!">shopping_cart</mat-icon>
          </span>
          <h1
            class="m-0 font-display text-[26px] leading-tight font-bold tracking-[-0.5px] lg:text-[30px]"
          >
            CartCheck
          </h1>
        </div>
        <p
          class="m-0 shrink-0 rounded-full bg-chip px-2.5 py-1.5 text-[13px] font-semibold text-ink-soft"
          aria-live="polite"
          data-testid="purchased-counter"
        >
          {{ purchased() }} de {{ total() }} comprados
        </p>
      </div>
      <mat-progress-bar
        mode="determinate"
        [value]="progress()"
        aria-label="Progreso de compras"
        [attr.aria-valuetext]="progress() + '% comprado'"
      />
    </header>
  `,
})
export class ListHeader {
  readonly purchased = input.required<number>();
  readonly total = input.required<number>();
  /** Porcentaje 0–100. */
  readonly progress = input.required<number>();
}
