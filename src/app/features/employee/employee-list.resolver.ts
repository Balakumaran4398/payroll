import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeListResolver {
  userid: any;
  constructor(private apiService: ApiService,
    private tokenStorage: TokenStorageService
  ) {
    this.userid = tokenStorage.getID;
  }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    // This will automatically call the correct API based on user role:
    // ROLE_ADMIN: /api/v1/user/admin/getemployeelist
    // ROLE_COMPANY: /api/v1/user/company/getemployeelist
    // ROLE_EMPLOYEE: /api/v1/user/employee/getemployeelist
    return this.apiService.getEmployeeList(this.userid).pipe(
      catchError(() => {
        // Return empty array if API fails, so component can still load
        console.log('Resolver: API failed, returning empty data');
        return of([]);
      })
    );
  }
}