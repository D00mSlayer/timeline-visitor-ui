// gmaps apikey = AIzaSyB13gKuiM2szZv2xr2aQhGRqpYL3T96lJg
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { BackendService } from '../backend.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Observable, catchError, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GoogleMap } from '@angular/google-maps';


@Component({
  selector: 'app-map-viewer',
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.css']
})
export class MapViewerComponent {

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  apiLoaded!: Observable<boolean>;
  year!: string;
  month!: string;
  day!: string;
  isSent: boolean = false;
  isReceived: boolean = false;
  fullDate: Date = new Date();

  constructor(
    private backendServices: BackendService,
    httpClient: HttpClient
  ) {
    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyB13gKuiM2szZv2xr2aQhGRqpYL3T96lJg', 'callback')
        .pipe(
          map(() => true),
          catchError(() => of(false)),
        );
  }

  zoom = 12;
  mapCenter!: google.maps.LatLngLiteral;
  mapOptions: google.maps.MapOptions = {
    // zoomControl: false,
    // scrollwheel: false,
    // disableDoubleClickZoom: true,
    //mapTypeId: "hybrid",
    maxZoom: 15,
    minZoom: 8
  };
  markers: any = [];
  markerPositions: google.maps.LatLngLiteral[] = [];
  vertices: google.maps.LatLngLiteral[] = [];
  // markerOptions: google.maps.MarkerOptions = {draggable: false};
  // mapCenter!: google.maps.LatLngLiteral;
  // mapOptions: google.maps.MapOptions = {
  //   zoom: 10
  // };

  ngOnInit() {
    // navigator.geolocation.getCurrentPosition(x => {
    //   this.mapCenter = {
    //     lat: x.coords.latitude,
    //     lng: x.coords.longitude
    //   };
    //   this.markers.push({
    //     position: {
    //       lat: x.coords.latitude,
    //       lng: x.coords.longitude
    //     },
    //     options: {
    //       animation: google.maps.Animation.DROP
    //     }
    //   });
    // });
  }

  makeChunks(directions: any[]): any[]{
    // Break up our coordinates into chunks of 25 to avoid rate limits
    let chunks: any[] = [];
    let chunkSize = 25;

    directions.forEach((waypoint, i) => {
      let pi = Math.floor(i / (chunkSize - 1));
      chunks[pi] = chunks[pi] || [];
      if (chunks[pi].length === 0 && pi !== 0) {
          chunks[pi] = [directions[i - 1]];
      }
      chunks[pi].push(waypoint);
    });
    return chunks;
  }

  constructRequests(chunks: any[]): any[] {
    let requests: any[] = [];
    chunks.forEach((chunk) => {
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

  buildRoute(requests: any[]) {
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

  animatePath(map: any, pathCoords: any[]) {
    let speed = 1000; // higher = slower/smoother
    // new google.maps.Map(document.getElementById('gMap'));

    const element = document.getElementById('gMap');
    if (element) {
      map = new google.maps.Map(element as HTMLElement);
      // Rest of your code using the 'map' instance
    } else {
      // Handle the case when the element with ID 'gMap' is not found
      return
    }

    let route = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      editable: false,
      map: map
    });

    // break into chunks for animation
    let chunk = Math.ceil(pathCoords.length / speed);
    let totalChunks = Math.ceil(pathCoords.length / chunk);
    let i = 1;

    function step() {
      // redraw polyline with bigger chunk
      route.setPath(pathCoords.slice(0, i * chunk));
      i++;
      if (i <= totalChunks) {
        window.requestAnimationFrame(step);
      }

    }
    window.requestAnimationFrame(step);
  }

  getDayData(dateValue: Date) {
    this.backendServices.getDayData(dateValue).subscribe(
      (data) => {
        if (data.length == 0) return;
        // debugger
        let chunks = this.makeChunks(this.googleTransformData(data));
        let requests = this.constructRequests(chunks);
        // let promises = this.buildRoute(requests);

        // wait for directions to be returned, then animate the route
        this.buildRoute(requests).then((results) => {
          let coords = results.flatMap((result: any) => {
            return result.steps.flatMap((step: { path: any; }) => step.path);
          });

          // finally animate path of our route
          // let samplemap = new google.maps.Map(document.getElementById('gMap'));
          this.animatePath(this.googleMap, coords);
        });
        




        // this.markerPositions = this.googleTransformData(data);
        let lplp = this.googleTransformData(data);
        // this.vertices = this.markerPositions;
        console.log(this.markerPositions);

        let bounds = new google.maps.LatLngBounds();
        lplp.forEach(x => {
          bounds.extend(new google.maps.LatLng(x))
        });
        let foo = new google.maps.LatLngBounds(
          new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng()),
          new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng())
        )
        this.googleMap.fitBounds(foo);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getStartPosition(inputArray: any){
    return [inputArray[0][3], inputArray[0][4]];
  }

  getEndPosition(inputArray: any){
    let lastEl = inputArray[inputArray.length - 1];
    return (lastEl[0] == 'PATH') ? [lastEl[5], lastEl[6]] : [lastEl[3], lastEl[4]];
  }

  calculateCenter(): void {
    if (this.markerPositions.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      for (const position of this.markerPositions) {
        bounds.extend(position);
      }
      // debugger

      this.mapCenter = bounds.getCenter().toJSON() as google.maps.LatLngLiteral;
      this.mapOptions = {
        center: bounds.getCenter().toJSON() as google.maps.LatLngLiteral
        // bounds: bounds.toJSON() as google.maps.LatLngBoundsLiteral,
    };
    }
  }

  fitMapToBounds(): void {
    const bounds = this.calculateBounds();
    // let boundsNew = new google.maps.LatLngBounds(
    //   new google.maps.LatLng(bounds.south),
    //   new google.maps.LatLng(bounds.east)
    // );
    // debugger
    // this.googleMap.fitBounds(boundsNew);
    // debugger
    // this.map.mapReady.pipe(take(1)).subscribe(() => {
    //   this.map.boundsChange.emit(bounds);
    // });
  }

  calculateBounds(): void {
    const bounds = new google.maps.LatLngBounds();
  
    this.markerPositions.forEach(marker => {
      bounds.extend(new google.maps.LatLng(marker.lat, marker.lng));
    });

    // this.googleMap?.fitBounds(bounds)
    let boundsNew = new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds.getSouthWest().toJSON()),
      new google.maps.LatLng(bounds.getNorthEast().toJSON())
    );
    this.googleMap.fitBounds(boundsNew);
    this.googleMap.panToBounds(boundsNew);
  
    // return {
    //   east: bounds.getNorthEast().lng(),
    //   north: bounds.getNorthEast().lat(),
    //   south: bounds.getSouthWest().lat(),
    //   west: bounds.getSouthWest().lng()
    // };
  }

  googleTransformData(data: any): google.maps.LatLngLiteral[] {
    const updatedData: number[][] = [];
    for (const activity of data) {
      if (activity[0] == 'PATH') {
        updatedData.push([activity[3], activity[4]]);
        if (typeof activity[7] === "string") {
          const waypoints = activity[7].split(' ');
          for (const waypoint of waypoints) {
            const latLngPair = waypoint.split(',');
            updatedData.push([parseFloat(latLngPair[0]), parseFloat(latLngPair[1])]);
          }
        }
        updatedData.push([activity[5], activity[6]]);
      } else if (activity[0] == 'VISIT') {
        updatedData.push([activity[3], activity[4]]);
      }
    }

    updatedData.forEach(each => {
      this.markers.push({
        position: {
          lat: each[0],
          lng: each[1]
        },
        options: {
          animation: google.maps.Animation.DROP
        }
      });
    })
  
    // Assuming each transformed item is an array with latitude at index 0 and longitude at index 1
    const transformedData: google.maps.LatLngLiteral[] = updatedData.map((each: any) => {
      return { lat: each[0], lng: each[1] };
    });
  
    return transformedData;
  }

  transformData(inputArray: any) {

    const transformData: number[][] = [];
    for (const activity of inputArray) {
      if (activity[0] == 'PATH') {
        transformData.push([activity[3], activity[4]]);
        if (typeof activity[7] === "string") {
          const waypoints = activity[7].split(' ');
          for (const waypoint of waypoints) {
            const latLngPair = waypoint.split(',');
            transformData.push([parseFloat(latLngPair[0]), parseFloat(latLngPair[1])]);
          }
        }
        transformData.push([activity[5], activity[6]]);
      } else if (activity[0] == 'VISIT') {
        transformData.push([activity[3], activity[4]]);
      }
    }

    console.log(transformData);    
    return transformData;
  }

  dateChanged(event: MatDatepickerInputEvent<Date>) {
    if (!event.value) return;
    console.log(event.value)
    this.getDayData(event.value);
  }

  // onMapReady(map: L.Map) {
  //   this.map = map;
  // }
}
