import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "first",
        loadComponent: () => import("./pages/first/first.component").then((m) => m.FirstComponent),
    },
    {
        path: "second",
        loadComponent: () =>
            import("./pages/second/second.component").then((m) => m.SecondComponent),
    },
];
