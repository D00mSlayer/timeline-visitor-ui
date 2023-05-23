import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http: HttpClient) { }

  getDayData(dateValue: Date): Observable<any> {
    // let params = new HttpParams().set('date', dateValue.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    let params = new HttpParams().set('date', dateValue.toISOString());
    return this.http.get<any>('http://127.0.0.1:5000/day_data', { params: params });
  }

}
