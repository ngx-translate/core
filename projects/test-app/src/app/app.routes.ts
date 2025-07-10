import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "global",
        loadComponent: () =>
            import("./pages/global/global.component").then((m) => m.GlobalComponent),
    },
    {
        path: "isolated",
        loadComponent: () =>
            import("./pages/isolated/isolated.component").then((m) => m.IsolatedComponent),
    },
    {
        path: "**",
        pathMatch: "full",
        redirectTo: "global",
    },
];
