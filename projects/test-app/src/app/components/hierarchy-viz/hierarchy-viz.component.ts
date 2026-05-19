import { Component, inject } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";
import { IconComponent } from "../icon/icon.component";

interface ServiceNode {
    isRoot: boolean;
    currentLang: string;
    fallbackLang: string | null;
    label?: string;
}

@Component({
    selector: "app-hierarchy-viz",
    imports: [NgTemplateOutlet, IconComponent],
    template: `
        <div class="hierarchy-container">
            <h3>Service Hierarchy</h3>
            @if (globalRoot) {
                <div class="parallel-trees">
                    <div class="tree-column">
                        <div class="tree-label">Global</div>
                        <div class="service-node">
                            <div class="node-icon"><app-icon name="tree-root" /></div>
                            <div class="node-info">
                                <span class="node-type">Root Service</span>
                                <span class="node-lang"
                                    >Lang: <code>{{ globalRoot.currentLang }}</code></span
                                >
                                @if (globalRoot.fallbackLang) {
                                    <span class="node-fallback"
                                        >Fallback:
                                        <code>{{ globalRoot.fallbackLang }}</code></span
                                    >
                                }
                            </div>
                        </div>
                    </div>
                    <div class="tree-column">
                        <div class="tree-label">Isolated</div>
                        <div class="hierarchy-tree">
                            @for (service of hierarchy; track service; let last = $last; let i = $index; let count = $count) {
                                <ng-container
                                    *ngTemplateOutlet="nodeTemplate; context: { $implicit: service, last, position: positionFor(i, count) }"
                                />
                            }
                        </div>
                    </div>
                </div>
            } @else {
                <div class="hierarchy-tree">
                    @for (service of hierarchy; track service; let last = $last; let i = $index; let count = $count) {
                        <ng-container
                            *ngTemplateOutlet="nodeTemplate; context: { $implicit: service, last, position: positionFor(i, count) }"
                        />
                    }
                </div>
            }
        </div>

        <ng-template #nodeTemplate let-service let-last="last" let-position="position">
            <div class="service-node" [class.current]="last">
                <div class="node-icon">
                    @switch (position) {
                        @case ("root") {
                            <app-icon name="tree-root" />
                        }
                        @case ("leaf") {
                            <app-icon name="tree-leaf" />
                        }
                        @default {
                            <app-icon name="tree-child" />
                        }
                    }
                </div>
                <div class="node-info">
                    <span class="node-type">{{
                        service.isRoot ? "Root Service" : "Child Service"
                    }}</span>
                    <span class="node-lang"
                        >Lang: <code>{{ service.currentLang }}</code></span
                    >
                    @if (service.fallbackLang) {
                        <span class="node-fallback"
                            >Fallback: <code>{{ service.fallbackLang }}</code></span
                        >
                    }
                </div>
            </div>
            @if (!last) {
                <div class="connector">
                    <div class="line"></div>
                </div>
            }
        </ng-template>
    `,
    styles: `
        .hierarchy-container {
            background: var(--surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            padding: 1.5rem;
            margin-top: 2rem;
            box-shadow: var(--shadow-sm);
        }
        h3 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .parallel-trees {
            display: flex;
            gap: 1.5rem;
        }
        .tree-column {
            flex: 1;
        }
        .tree-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
        .hierarchy-tree {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .service-node {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            background: #f1f5f9;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            width: 100%;
            transition: all 0.2s;
        }
        .service-node.current {
            background: #eef2ff;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        .node-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.75rem;
            height: 1.75rem;
            color: var(--primary);
            flex-shrink: 0;
        }
        .node-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .node-type {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-main);
        }
        .node-lang,
        .node-fallback {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        .connector {
            display: flex;
            justify-content: center;
            width: 3rem;
            height: 1.5rem;
            margin-left: 0.5rem;
        }
        .line {
            width: 2px;
            height: 100%;
            background: var(--border);
        }
    `,
})
export class HierarchyVizComponent {
    private currentService = inject(TranslateService);

    /** Non-null when the current service is an isolated root (separate tree from global root) */
    get globalRoot(): ServiceNode | null {
        const svc = this.currentService as any;
        if (!svc.isRoot || !svc.parent) {
            return null;
        }
        // Walk up to the true global root
        let root = svc.parent;
        while (root.parent) {
            root = root.parent;
        }
        return {
            isRoot: true,
            currentLang: root.getCurrentLang(),
            fallbackLang: root.getFallbackLang(),
        };
    }

    positionFor(index: number, count: number): "root" | "child" | "leaf" {
        if (index === 0) return "root";
        if (index === count - 1) return "leaf";
        return "child";
    }

    get hierarchy(): ServiceNode[] {
        const list: ServiceNode[] = [];
        let current: any = this.currentService;

        while (current) {
            list.unshift({
                isRoot: current.isRoot,
                currentLang: current.getCurrentLang(),
                fallbackLang: current.getFallbackLang(),
            });
            // Stop at root — don't walk into a different service tree via DI parent
            if (current.isRoot) {
                break;
            }
            current = current.parent;
        }

        return list;
    }
}
