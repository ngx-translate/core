import { Directive, inject, input, TemplateRef } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "ng-template[translateSlot]",
    standalone: true,
})
export class TranslateSlotDirective {
    readonly name = input.required<string>({ alias: "translateSlot" });
    readonly template = inject(TemplateRef<unknown>);
}
