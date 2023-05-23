import { NgModule } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { BrowserModule } from '@angular/platform-browser';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
// import { MapViewerComponent } from './map-viewer/map-viewer.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatNativeDateModule } from '@angular/material/core';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { GoogleMapsModule } from '@angular/google-maps'
import { MapViewerModule } from './map-viewer/map-viewer.module';

@NgModule({
  declarations: [
    AppComponent,
    // MapViewerComponent,
    HomeComponent,
  ],
  imports: [
    // FormsModule,
    // BrowserModule,
    // BrowserAnimationsModule,
    HttpClientModule,
    LeafletModule,
    MapViewerModule,
    AppRoutingModule,
    // MatFormFieldModule,
    // MatInputModule,
    // MatNativeDateModule,
    // MatDatepickerModule,
    // MatCheckboxModule,
    // GoogleMapsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
