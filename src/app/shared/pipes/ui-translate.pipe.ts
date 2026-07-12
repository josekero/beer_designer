import { Pipe, PipeTransform, inject } from '@angular/core';
import { ApplicationSettingsService } from '../../core/services/application-settings.service';

@Pipe({
  name: 'uiTranslate',
  standalone: true,
  pure: false
})
export class UiTranslatePipe implements PipeTransform {
  private readonly settings = inject(ApplicationSettingsService);

  transform(value: string | null | undefined): string {
    return value ? this.settings.translate(value) : '';
  }
}
