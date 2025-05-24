import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class MarkerInterceptor implements HttpInterceptor {
    triggered = false;

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.triggered = true;

        const modified = req.clone({
            setHeaders: {
                'X-Test-Header': 'marker'
            }
        });

        return next.handle(modified);
    }
}