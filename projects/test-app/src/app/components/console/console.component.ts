import {
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    inject,
    signal,
    viewChild,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { ConsoleLogService } from "../../services/console-log.service";

@Component({
    selector: "app-console",
    imports: [DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="console" [class.collapsed]="collapsed()" [class.empty]="entries().length === 0">
            <div class="bar" (click)="toggle()">
                <span class="title">
                    <span class="dot"></span>
                    Console
                    <span class="count">{{ entries().length }}</span>
                </span>
                <span class="actions">
                    @if (!collapsed() && entries().length > 0) {
                        <button
                            type="button"
                            class="action"
                            (click)="clear($event)"
                            title="Clear log"
                            aria-label="Clear log"
                        >
                            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M6 2h4a1 1 0 0 1 1 1v1h3v1H2V4h3V3a1 1 0 0 1 1-1zm0 2h4V3H6v1zM3 6h10l-.8 8.1a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9L3 6zm3 2v5h1V8H6zm3 0v5h1V8H9z"
                                />
                            </svg>
                        </button>
                    }
                    <button
                        type="button"
                        class="action toggle"
                        [attr.aria-expanded]="!collapsed()"
                        [attr.aria-label]="collapsed() ? 'Expand' : 'Collapse'"
                    >
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                            @if (collapsed()) {
                                <path fill="currentColor" d="M8 5l5 6H3z" />
                            } @else {
                                <path fill="currentColor" d="M8 11L3 5h10z" />
                            }
                        </svg>
                    </button>
                </span>
            </div>
            @if (!collapsed() && entries().length > 0) {
                <div class="body" #body>
                    @for (entry of entries(); track entry.id) {
                        <div class="entry" [title]="entry.formatted">
                            <span class="time">{{ entry.timestamp | date: "HH:mm:ss.SSS" }}</span>
                            <span class="label">{{ entry.label }}</span>
                            @if (entry.value !== undefined) {
                                <span class="value">{{ entry.formatted }}</span>
                            }
                        </div>
                    }
                </div>
            }
        </div>
    `,
    styles: `
        :host {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            z-index: 1000;
            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
            font-size: 0.7rem;
        }

        .console {
            width: 520px;
            max-width: calc(100vw - 2rem);
            background: rgba(17, 24, 39, 0.78);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            box-shadow:
                0 12px 32px rgba(0, 0, 0, 0.25),
                0 2px 6px rgba(0, 0, 0, 0.15);
            color: #e5e7eb;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: width 0.15s ease;
        }

        .console.empty {
            width: auto;
            min-width: 160px;
        }

        .bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 0.25rem 0.4rem 0.25rem 0.6rem;
            cursor: pointer;
            user-select: none;
            line-height: 1;
            min-height: 22px;
        }

        .title {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-weight: 600;
            letter-spacing: 0.03em;
            white-space: nowrap;
        }

        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #34d399;
        }

        .count {
            background: rgba(255, 255, 255, 0.14);
            padding: 0 0.4rem;
            border-radius: 999px;
            font-size: 0.6rem;
            font-weight: 500;
            min-width: 1ch;
            text-align: center;
        }

        .actions {
            display: inline-flex;
            align-items: center;
            gap: 0.1rem;
        }

        .action {
            background: transparent;
            border: none;
            color: inherit;
            padding: 2px 4px;
            cursor: pointer;
            opacity: 0.65;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 0;
            border-radius: 4px;
        }

        .action:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.08);
        }

        .body {
            max-height: 220px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.25);
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
        }

        .entry {
            display: grid;
            grid-template-columns: auto auto 1fr;
            column-gap: 0.5rem;
            align-items: baseline;
            padding: 0.15rem 0.6rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            line-height: 1.4;
        }

        .entry:last-child {
            border-bottom: none;
        }

        .time {
            color: rgba(229, 231, 235, 0.5);
            white-space: nowrap;
        }

        .label {
            font-weight: 600;
            color: #f9fafb;
            white-space: nowrap;
        }

        .value {
            color: rgba(229, 231, 235, 0.75);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
    `,
})
export class ConsoleComponent {
    private service = inject(ConsoleLogService);
    private body = viewChild<ElementRef<HTMLDivElement>>("body");

    readonly entries = this.service.entries;
    readonly collapsed = signal(false);

    constructor() {
        effect(() => {
            // Track entries to retrigger on new logs; DOM is already updated by the time the effect runs.
            this.entries();
            const el = this.body()?.nativeElement;
            if (el) queueMicrotask(() => (el.scrollTop = el.scrollHeight));
        });
    }

    toggle() {
        this.collapsed.update((v) => !v);
    }

    clear(event: MouseEvent) {
        event.stopPropagation();
        this.service.clear();
    }
}
