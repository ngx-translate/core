import {TranslatePipe} from './src/translate.pipe';
import {TranslateService} from './src/translate.service';

export * from './src/translate.pipe';
export * from './src/translate.service';
export * from './src/translate.parser';
export * from './src/missingtranslationhandler.interface';

export default {
  pipes: [TranslatePipe],
  providers: [TranslateService]
}