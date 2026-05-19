import { Injectable, signal } from "@angular/core";

export interface ConsoleLogEntry {
    id: number;
    timestamp: Date;
    label: string;
    value: unknown;
    formatted: string;
}

const MAX_ENTRIES = 100;

@Injectable({ providedIn: "root" })
export class ConsoleLogService {
    private nextId = 0;
    readonly entries = signal<ConsoleLogEntry[]>([]);

    log(label: string, value?: unknown): void {
        console.info(label, value);

        const entry: ConsoleLogEntry = {
            id: this.nextId++,
            timestamp: new Date(),
            label,
            value,
            formatted: this.format(value),
        };

        this.entries.update((list) => {
            const next = [...list, entry];
            return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
        });
    }

    clear(): void {
        this.entries.set([]);
    }

    private format(value: unknown): string {
        if (typeof value === "string") return value;
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
}
