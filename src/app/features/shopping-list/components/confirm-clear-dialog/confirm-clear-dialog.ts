import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmClearDialogData {
  readonly count: number;
}

/** Diálogo de confirmación; se cierra con `true` si el usuario confirma. */
@Component({
  selector: 'app-confirm-clear-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    @let count = data.count;
    <h2 mat-dialog-title>¿Limpiar la lista?</h2>
    <mat-dialog-content>
      <p class="m-0">
        Se {{ count === 1 ? 'eliminará 1 producto' : 'eliminarán ' + count + ' productos' }}. Esta
        acción no se puede deshacer.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="false">Cancelar</button>
      <button
        matButton="filled"
        type="button"
        class="cc-button-danger-filled"
        [mat-dialog-close]="true"
      >
        Limpiar lista
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmClearDialog {
  protected readonly data = inject<ConfirmClearDialogData>(MAT_DIALOG_DATA);
}
