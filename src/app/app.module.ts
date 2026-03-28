import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptorService } from './core/interceptors/auth-interceptor.service';
import { CoreModule } from './core/core.module';
import { LayoutOverlayContainer } from './core/services/layout-overlay-container.service';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CoreModule,
    AppRoutingModule,
  ],
  providers: [
    
    LayoutOverlayContainer,
    {
      provide: OverlayContainer,
      useExisting: LayoutOverlayContainer,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
 
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
