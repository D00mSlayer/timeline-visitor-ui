import { Component } from '@angular/core';
import { BackendService } from '../backend.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Loader } from "@googlemaps/js-api-loader"

@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css']
})
export class MapViewerComponent {

  users: any = [];
  selectedUserId!: number;
  googleMap!: google.maps.Map;
  advancedMarkerEl: any;
  paymentType: string = 'A';
  route: any;
  bounds: any;
  markerCluster: any;
  markers: any = [];
  directions: any[] = [];
  fullDate: Date = new Date();

  constructor(
    private backendServices: BackendService
  ) {
    const loader = new Loader({
      apiKey: "",
      version: "weekly",
      libraries: ['marker']
    });
    
    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      const mapEl = document.getElementById("map") as HTMLElement;
      this.googleMap = new Map(mapEl, {
        mapId: "",
        zoom: 12,
        maxZoom: 18,
        minZoom: 8
      });
      this.advancedMarkerEl = AdvancedMarkerElement;
    });
  }

  ngOnInit() {
    this.backendServices.getAvailableUsers().subscribe((data: any) => {
      this.users = data;
    });
  }

  buildAndAnimateRoute(requests: any) {
    this.requestRoutes(requests).then((results) => {
      let coords = results.flatMap((result: any) => {
        return result.steps.flatMap((step: { path: any; }) => step.path);
      });
      this.animatePath(coords);
    });
  }

  requestRoutes(requests: any[]) {
    let directionsService = new google.maps.DirectionsService();
    return Promise.all(requests.map((request) => {
      return new Promise(function(resolve) {
        directionsService.route(request, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            return resolve(result?.routes[0].legs[0]);
          }
        });
      });
    }));
  }

  animatePath(pathCoords: any[]) {
    let speed = 5000; // higher = slower/smoother
    const lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 2,
      scale: 2
    };
  
    // Define the symbol, using one of the predefined paths ('CIRCLE')
    // supplied by the Google Maps JavaScript API.
    const myMarker = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 4,
      fillOpacity: 1,
      strokeColor: '#e53935'
    };

    this.route = new google.maps.Polyline({
      path: [],
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '10px'
      }, {
        icon: myMarker,
        offset: '100%'
      }],
      geodesic: true,
      strokeColor: '#FF0000',
      // strokeColor: '#0eb7f6',
      // strokeOpacity: 1.0,
      // strokeWeight: 3,
      editable: false
    });
    this.route.setMap(this.googleMap as any);

    // break into chunks for animation
    let chunk = Math.ceil(pathCoords.length / speed);
    let totalChunks = Math.ceil(pathCoords.length / chunk);
    let i = 1;

    const step = () => {
      this.route.setPath(pathCoords.slice(0, i * chunk));
      i++;
      if (i <= totalChunks) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);
  }

  clearMapDrawings() {
    this.bounds = new google.maps.LatLngBounds();
    this.directions = [];
    if (this.markerCluster && this.markers) {
      this.markerCluster.removeMarkers(this.markers);
      this.markers = [];
    }
    if (!this.route) return;
    this.route.setMap(null);
  }

  addDirection(lat: number, lng: number){
    this.directions.push({lat: lat, lng: lng});
  }

  addBound(lat: number, lng: number){
    this.bounds.extend({lat: lat, lng: lng});
  }

  fitBounds() {
    let fitBounds = new google.maps.LatLngBounds(this.bounds)
    this.googleMap.fitBounds(fitBounds);
  }

  generatePriceTagMarker(lat: number, lng: number, transactionType: string, amount: string, timeStamp: string): HTMLElement {
    const latLng = new google.maps.LatLng(lat + (Math.random() / 1000), lng + (Math.random() / 1000)),
      color = (transactionType == 'Sent') ? '#cf532d' : '#7bd811',
      localDt = new Date(timeStamp),
      priceTagMarkerEl = document.createElement('div');

    priceTagMarkerEl.className = 'price-tag';
    priceTagMarkerEl.style.backgroundColor = color;
    priceTagMarkerEl.textContent = amount.toString() + ' @ ' + localDt.toLocaleTimeString();

    const advancedMarker = new this.advancedMarkerEl({
      map: this.googleMap,
      position: latLng,
      content: priceTagMarkerEl
    });
    return advancedMarker;
  }

  createChunksOfDirections() {
    let chunks: any = [];
    let chunkSize: any = 25;
    this.directions.forEach((waypoint: any, i: number) => {
        let pi = Math.floor(i / (chunkSize - 1));
        chunks[pi] = chunks[pi] || [];
        if (chunks[pi].length === 0 && pi !== 0) {
            chunks[pi] = [this.directions[i - 1]];
        }
        chunks[pi].push(waypoint);
    });
    return chunks;
  }

  createRequests(chunks: any) {
    let requests: any = [];

    chunks.forEach((chunk: any) => {
      let origin = chunk[0];
      let destination = chunk[chunk.length - 1];
      let waypoints = chunk.slice(1, -1).map((waypoint: any) => {
        return {
            location: new google.maps.LatLng(waypoint.lat, waypoint.lng),
            stopover: false
        }
      });
      requests.push({
          travelMode: 'DRIVING',
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypoints
      });
    });
    return requests;
  }

  getDayData(dateValue: Date) {
    this.backendServices.getDayData(dateValue, this.selectedUserId, this.paymentType).subscribe(
      (data) => {
        this.clearMapDrawings();
        if (data.length == 0) return;

        data.forEach((each: any) => {
            if (each.activity_type == 'VISIT') {
                this.addDirection(each.location_lat, each.location_lng);
                this.addBound(each.location_lat, each.location_lng);
            } else if (each.activity_type == 'PATH') {
                this.addDirection(each.start_location_lat, each.start_location_lng);
                this.addDirection(each.end_location_lat, each.end_location_lng);
                this.addBound(each.start_location_lat, each.start_location_lng);
                this.addBound(each.end_location_lat, each.end_location_lng);
            } else if (each.activity_type == 'PAYMENT' && each.location_lat && each.location_lng) {
                this.addBound(each.location_lat, each.location_lng);
                this.markers.push(
                  this.generatePriceTagMarker(
                    each.location_lat, each.location_lng,
                    each.transaction_type, each.amount,
                    each.start_timestamp
                  )
                );
            }
        });
        this.markerCluster = new MarkerClusterer({ markers: this.markers, map: this.googleMap });
        const chunks = this.createChunksOfDirections();
        const requests = this.createRequests(chunks);
        this.buildAndAnimateRoute(requests);
        this.fitBounds();
      }, (error) => {
        console.log(error);
      }
    );
  }

  dateChanged(event: MatDatepickerInputEvent<Date>) {
    if (!event.value) return;
    this.getDayData(event.value);
  }

}
