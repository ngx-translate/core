import { Component, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { IconComponent } from "../icon/icon.component";

// Hierarchy walk:
//
//   currentService → getParent() → getParent() → ... → null
//
// Each service points to its translate-parent. A `null` return means this
// service is a root — either the global root, or an isolated subtree root.
// The page header on /isolated tells the user which kind of root they're
// looking at; the viz itself just renders the chain it can see.

interface ServiceNode {
    isRoot: boolean;
    currentLang: string;
    fallbackLang: string | null;
}

@Component({
    selector: "app-hierarchy-viz",
    imports: [IconComponent],
    template: `
        <div class="hierarchy-container">
            <h3>Service Hierarchy</h3>
            <div class="hierarchy-tree">
                @for (
                    service of hierarchy;
                    track $index;
                    let last = $last;
                    let i = $index;
                    let count = $count
                ) {
                    <div class="service-node" [class.current]="last">
                        <div class="node-icon">
                            @switch (positionFor(i, count)) {
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
                }
            </div>
        </div>
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

    positionFor(index: number, count: number): "root" | "child" | "leaf" {
        if (index === 0) return "root";
        if (index === count - 1) return "leaf";
        return "child";
    }

    get hierarchy(): ServiceNode[] {
        const list: ServiceNode[] = [];
        let current: TranslateService | null = this.currentService;

        while (current) {
            const parent = current.getParent();
            list.unshift({
                isRoot: parent === null,
                currentLang: current.getCurrentLang() ?? "",
                fallbackLang: current.getFallbackLang(),
            });
            current = parent;
        }

        return list;
    }
}
