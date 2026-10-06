import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    inject,
    input,
    TemplateRef,
} from "@angular/core";
import { TranslateSlotDirective } from "./translate-slot.directive";
import { TranslateService } from "./translate.service";
import { InterpolationParameters } from "./translate.service.interface";
import { getValue, isString } from "./util";

interface TranslateSlotsPart {
    readonly id: string;
    readonly text?: string;
    readonly template?: TemplateRef<unknown>;
}

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "[translateSlots]",
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: "./translate-slots.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslateSlotsComponent {
    readonly key = input.required<string>({ alias: "translateSlots" });
    readonly translateParams = input<InterpolationParameters>();

    private readonly translate = inject(TranslateService);
    private readonly slots = contentChildren(TranslateSlotDirective);
    private readonly marker = `\uE000${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}\uE000`;

    protected readonly parts = computed(() => {
        const slots = this.slots();
        const translateParams = this.translateParams();
        const params: InterpolationParameters = { ...translateParams };
        const names = new Set<string>();
        for (const [index, slot] of slots.entries()) {
            const name = slot.name();
            if (names.has(name)) {
                throw new Error(`@ngx-translate/core: duplicate translateSlot "${name}".`);
            }
            if (getValue(translateParams, name) !== undefined) {
                throw new Error(
                    `@ngx-translate/core: translateSlot "${name}" is also passed in translateParams.`,
                );
            }
            names.add(name);
            params[name] = `${this.marker}${index}${this.marker}`;
        }

        const translation = this.translate.instant(this.key(), params);
        const occurrences = new Map<string, number>();
        return (isString(translation) ? translation : this.key())
            .split(this.marker)
            .flatMap((chunk, index): TranslateSlotsPart[] => {
                if (index % 2 === 0) {
                    return chunk ? [{ id: `text:${index}`, text: chunk }] : [];
                }
                const slot = slots[Number(chunk)];
                const occurrence = occurrences.get(slot.name()) ?? 0;
                occurrences.set(slot.name(), occurrence + 1);
                return [{ id: `slot:${slot.name()}:${occurrence}`, template: slot.template }];
            });
    });
}
