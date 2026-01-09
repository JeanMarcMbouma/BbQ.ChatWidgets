import { Type } from '@angular/core';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';
import {
  ButtonWidgetComponent,
  CardWidgetComponent,
  InputWidgetComponent,
  TextAreaWidgetComponent,
  DropdownWidgetComponent,
  SliderWidgetComponent,
  ToggleWidgetComponent,
  FileUploadWidgetComponent,
  ThemeSwitcherWidgetComponent,
  DatePickerWidgetComponent,
  MultiSelectWidgetComponent,
  ProgressBarWidgetComponent,
  FormWidgetComponent,
  ImageWidgetComponent,
  ImageCollectionWidgetComponent,
} from '../components';

/**
 * Registry of all built-in widget components
 * Maps widget type to Angular component class
 */
export const BUILT_IN_WIDGET_COMPONENTS: Record<string, Type<CustomWidgetComponent>> = {
  button: ButtonWidgetComponent,
  card: CardWidgetComponent,
  input: InputWidgetComponent,
  textarea: TextAreaWidgetComponent,
  dropdown: DropdownWidgetComponent,
  slider: SliderWidgetComponent,
  toggle: ToggleWidgetComponent,
  fileupload: FileUploadWidgetComponent,
  themeswitcher: ThemeSwitcherWidgetComponent,
  datepicker: DatePickerWidgetComponent,
  multiselect: MultiSelectWidgetComponent,
  progressbar: ProgressBarWidgetComponent,
  form: FormWidgetComponent,
  image: ImageWidgetComponent,
  imagecollection: ImageCollectionWidgetComponent,
};
