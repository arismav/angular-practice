import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskFormComponent {
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleInvalid(): boolean {
    const ctrl = this.form.controls.title;
    return ctrl.invalid && ctrl.dirty;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.taskService.addTask(this.form.controls.title.value!);
    this.form.reset();
  }
}
