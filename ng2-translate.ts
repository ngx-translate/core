import {TranslateDirective} from './src/translate.directive';
import {TranslatePipe} from './src/translate.pipe';
import {TranslateService} from './src/translate.service';

export * from './src/translate.directive';
export * from './src/translate.pipe';
export * from './src/translate.service';
export * from './src/translate.parser';

export default {
  directives: [TranslateDirective],
  pipes: [TranslatePipe],
  providers: [TranslateService]
}
