import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "app-hierarchy-viz",
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="hierarchy-container">
      <h3>Service Hierarchy</h3>
      <div class="hierarchy-tree">
        <ng-container *ngFor="let service of hierarchy; let last = last">
          <div class="service-node" [class.current]="last">
            <div class="node-icon">
              <span *ngIf="service.isRoot; else childIcon">🏠</span>
              <ng-template #childIcon>📦</ng-template>
            </div>
            <div class="node-info">
              <span class="node-type">{{ service.isRoot ? 'Root Service' : 'Child Service' }}</span>
              <span class="node-lang">Lang: <code>{{ service.currentLang }}</code></span>
              <span class="node-fallback" *ngIf="service.fallbackLang">Fallback: <code>{{ service.fallbackLang }}</code></span>
            </div>
          </div>
          <div class="connector" *ngIf="!last">
            <div class="line"></div>
          </div>
        </ng-container>
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
      font-size: 1.25rem;
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
    .node-lang, .node-fallback {
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
  `
})
export class HierarchyVizComponent {
    private currentService = inject(TranslateService);

    get hierarchy() {
        const list: any[] = [];
        let current: any = this.currentService;

        while (current) {
            list.unshift({
                isRoot: current.isRoot,
                currentLang: current.getCurrentLang(),
                fallbackLang: current.getFallbackLang()
            });
            current = current.parent;
        }

        return list;
    }
}
