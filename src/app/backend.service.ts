import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http: HttpClient) { }

  getDayData(dateValue: Date, userId: number, paymentType: string): Observable<any> {
    let params = new HttpParams()
      .set('date', dateValue.toISOString())
      .set('userId', userId)
      .set('paymentType', paymentType);
    return this.http.get<any>('http://127.0.0.1:5000/get-day-information', { params: params });
  }

  getAvailableUsers(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:5000/get-all-users');
  }

}
