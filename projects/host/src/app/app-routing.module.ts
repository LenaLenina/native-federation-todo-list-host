import { APP_INITIALIZER, NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { ConfigService } from './services/config.service';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
];

export function initializeRoutes(router: Router, configService: ConfigService) {
  return (): Observable<any> => {
    return configService.getConfig()
    .pipe(
      switchMap((routesJson) => {
        if (!Array.isArray(routesJson)) {
          console.error('routesJson is not an array');
          return [];
        }

        let dynamicRoutes = routesJson.map((route) => ({
          path: route.path,
          loadChildren: () =>
            loadRemoteModule({
              remoteName: route.remoteName,
              exposedModule: route.exposedModule,
            })
              .then((m) => m[route.module])
              .catch((err) => console.log(err)),
        }));

        router.resetConfig([...routes, ...dynamicRoutes]);
        return [];
      })
    );
  };
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRoutes,
      multi: true,
      deps: [Router, ConfigService]
    }
  ]
})
export class AppRoutingModule {
  constructor() { }
}