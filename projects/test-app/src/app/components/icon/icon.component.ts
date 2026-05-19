import { ChangeDetectionStrategy, Component, input } from "@angular/core";

type IconName =
    | "home"
    | "cube"
    | "cog"
    | "beaker"
    | "globe"
    | "layers"
    | "lock"
    | "cloud-download"
    | "tree-root"
    | "tree-child"
    | "tree-leaf"
    | "tree-isolated-root";

@Component({
    selector: "app-icon",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.75"
            stroke="currentColor"
            aria-hidden="true"
        >
            @switch (name()) {
                @case ("home") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                }
                @case ("cube") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                    />
                }
                @case ("cog") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.213-1.28Z"
                    />
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                }
                @case ("beaker") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.068-3.611L5 14.5"
                    />
                }
                @case ("globe") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                    />
                }
                @case ("layers") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
                    />
                }
                @case ("lock") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                }
                @case ("cloud-download") {
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                    />
                }
                @case ("tree-root") {
                    <!-- Filled node at top with branches down to two outline nodes -->
                    <circle cx="12" cy="5" r="3" fill="currentColor" stroke="none" />
                    <path
                        stroke-linecap="round"
                        d="M12 8v4M12 12h-6v3M12 12h6v3"
                    />
                    <circle cx="6" cy="18" r="2" fill="none" />
                    <circle cx="18" cy="18" r="2" fill="none" />
                }
                @case ("tree-child") {
                    <!-- Outline node at top, filled node in middle, outline node below -->
                    <circle cx="12" cy="4" r="2" fill="none" />
                    <path stroke-linecap="round" d="M12 6v3" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                    <path stroke-linecap="round" d="M12 15v3" />
                    <circle cx="12" cy="20" r="2" fill="none" />
                }
                @case ("tree-leaf") {
                    <!-- Outline node at top, line, filled leaf node at bottom -->
                    <circle cx="12" cy="4" r="2" fill="none" />
                    <path stroke-linecap="round" d="M12 6v9" />
                    <circle cx="12" cy="18" r="3" fill="currentColor" stroke="none" />
                }
                @case ("tree-isolated-root") {
                    <!-- Root node drawn as (X): circle with X inside, signaling
                         "no parent link". Branches down to two outline children. -->
                    <circle cx="12" cy="6" r="3.5" fill="none" />
                    <path stroke-linecap="round" d="m9.7 3.7 4.6 4.6M14.3 3.7l-4.6 4.6" />
                    <path stroke-linecap="round" d="M12 9.5v2.5M12 12h-6v3M12 12h6v3" />
                    <circle cx="6" cy="18" r="2" fill="none" />
                    <circle cx="18" cy="18" r="2" fill="none" />
                }
            }
        </svg>
    `,
    styles: `
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.125em;
            height: 1.125em;
            line-height: 1;
            flex-shrink: 0;
            color: currentColor;
        }
        svg {
            width: 100%;
            height: 100%;
        }
    `,
})
export class IconComponent {
    readonly name = input.required<IconName>();
}
