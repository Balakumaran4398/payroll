import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    // private baseUrl = 'http://192.168.1.105:8081/api/v1';
    private baseUrl = 'http://192.168.70.100:8585/dsr/api/v1';
    // private baseUrl = 'https://crm.ridsys.in:8080/dsr/api/v1';
    private employeeListCache: any[] | null = null;
    private employeeListRequest$: Observable<any> | null = null;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
    }

    private getHeaders(): HttpHeaders {
        return this.getAuthHeaders().set('Content-Type', 'application/json');
    }

    // Role-based API endpoint builder
    private getRoleBasedUrl(endpoint: string): string {
        const role = this.authService.getRole();

        switch (role) {
            case 'ROLE_ADMIN':
                return `${this.baseUrl}/${endpoint}`;
            case 'ROLE_COMPANY':
            case 'ROLE_MANAGER':
                return `${this.baseUrl}/${endpoint}`;
            case 'ROLE_EMPLOYEE':
                return `${this.baseUrl}/${endpoint}`;
            default:
                return `${this.baseUrl}/${endpoint}`;
        }
    }

    // Employee APIs
    getEmployeeList_1(forceRefresh = false, employee_id: number): Observable<any> {
        if (!forceRefresh && this.employeeListCache) {
            return of(this.employeeListCache);
        }

        if (!forceRefresh && this.employeeListRequest$) {
            return this.employeeListRequest$;
        }

        const url = this.getRoleBasedUrl('user/all?employee_id=' + employee_id);
        this.employeeListRequest$ = this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
            tap((data) => {
                this.employeeListCache = data || [];
            }),
            finalize(() => {
                this.employeeListRequest$ = null;
            }),
            shareReplay(1)
        );

        return this.employeeListRequest$;
    }

    getEmployeeList(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('user/all?employee_id=' + employee_id);
        this.employeeListRequest$ = this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
            tap((data) => {
                this.employeeListCache = data || [];
            }),
            finalize(() => {
                this.employeeListRequest$ = null;
            }),
            shareReplay(1)
        );

        return this.employeeListRequest$;
    }

    setEmployeeListCache(data: any[]): void {
        this.employeeListCache = data || [];
    }

    clearEmployeeListCache(): void {
        this.employeeListCache = null;
    }
    employeeCreate(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('user/create');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    employeeUpdate(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('user/update');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getAllDepartments(): Observable<any> {
        const url = this.getRoleBasedUrl('department/getalldepartments');
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getAllShifts(): Observable<any> {
        const url = this.getRoleBasedUrl('common/getallshifts');
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getDesignationDepartments(deptid: number): Observable<any> {
        const url = this.getRoleBasedUrl('department/designationbydepartment?department_id=' + deptid);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // getEmployeeDetails(id: number): Observable<any> {
    //     const url = this.getRoleBasedUrl(`getemployeedetails/${id}`);
    //     return this.http.get(url, { headers: this.getHeaders() });
    // }
    getDeleteEmployee(employee_id: number, username: string): Observable<any> {
        const url = this.getRoleBasedUrl('user/delete?employee_id=' + employee_id + '&username=' + username);
        return this.http.delete(url, { headers: this.getHeaders() });
    }

    // Company APIs
    getCompanyList(): Observable<any> {
        const url = this.getRoleBasedUrl('getcompanylist');
        return this.http.get(url, { headers: this.getHeaders() });
    }

    getemployeedetails(username: any): Observable<any> {
        const url = this.getRoleBasedUrl(`user/getemployeedetails?username=` + username);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // Admin APIs
    getAdminDashboard(): Observable<any> {
        const url = this.getRoleBasedUrl('getadmindashboard');
        return this.http.get(url, { headers: this.getHeaders() });
    }

    getSystemStats(): Observable<any> {
        const url = this.getRoleBasedUrl('getsystemstats');
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // Attendance APIs

    // ---------------------------OnDuty----------------------


    getRequestforonduty(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/requestforonduty');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getEditOnduty(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/editondutyrequest');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getondutylist(employee_id: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getondutylist?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    getDeleteOndutyRequest(requestId: number, createdby: string): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/deleteondutyrequest?id=' + requestId + '&createdby=' + createdby);
        return this.http.delete(url, { headers: this.getHeaders() });
    }


    checkIn(): Observable<any> {
        const url = this.getRoleBasedUrl('checkin');
        return this.http.post(url, {}, { headers: this.getHeaders() });
    }

    checkOut(): Observable<any> {
        const url = this.getRoleBasedUrl('checkout');
        return this.http.post(url, {}, { headers: this.getHeaders() });
    }
    // Holiday

    createHoliday(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/createholiday');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    editHoliday(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/editholiday');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getDeleteholiday(id: number, createdby: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/deleteholiday?id=' + id + '&createdby=' + createdby);
        return this.http.delete(url, { headers: this.getHeaders() });
    }
    getholidays(companyid: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getholidays?companyid=' + companyid);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    //Leave Type
    createLeave(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/requestforleave');
        const headers = requestbody instanceof FormData ? this.getAuthHeaders() : this.getHeaders();
        return this.http.post(url, requestbody, {
            headers
        });
    }
    getLeaveDetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getleavedetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    editleavedetails(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/editleavedetails');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getDeleteLeaveDetails(requestId: number, createdby: string): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/deleteleaverequest?id=' + requestId + '&createdby=' + createdby);
        return this.http.delete(url, { headers: this.getHeaders() });
    }
    // permission

    createPermission(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/requestforpermission');
        const headers = requestbody instanceof FormData ? this.getAuthHeaders() : this.getHeaders();
        return this.http.post(url, requestbody, {
            headers
        });
    }
    getPermissionDetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getpermissiondetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    editPermissiontails(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/editpermissiondetails');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getDeletePermissionDetails(requestId: number, createdby: string): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/deletepermissionrequest?id=' + requestId + '&createdby=' + createdby);
        return this.http.delete(url, { headers: this.getHeaders() });
    }
    // Swipe

    createSwipeRequest(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/requestforswipe');
        const headers = requestbody instanceof FormData ? this.getAuthHeaders() : this.getHeaders();
        return this.http.post(url, requestbody, {
            headers
        });
    }
    getSwipeDetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getswipedetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    editSwipeDetails(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/editswipedetails');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getDeleteSwipeDetails(requestId: number, createdby: string): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/deleterequestswipe?id=' + requestId + '&createdby=' + createdby);
        return this.http.delete(url, { headers: this.getHeaders() });
    }

    // Leave Settings
    updateleavesettings(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/updateleavesettings');
        const headers = requestbody instanceof FormData ? this.getAuthHeaders() : this.getHeaders();
        return this.http.post(url, requestbody, {
            headers
        });
    }
    getleavetype(): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getleavetype');
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getemployeeleaveinfo(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getemployeeleaveinfo?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    getdashboarddetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/dashboarddetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // Weekoff Settings 
    getweekoffsettings(companyid: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getweekoffsettings?companyid=' + companyid);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    updateweekendsettings(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/updateweekendsettings');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    // Calendor
    getAttendanceDetails(employee_id: number, month: string, year: string): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getattendancedetails?employee_id=' + employee_id + '&month=' + month + '&year=' + year);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // All Request
    getAllrequests(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/allrequests?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getNotifications(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/notifications?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }


    //  Payroll  - CTC & payslip

    CreateSalaryDetails(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/updatesalarysetting');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getSalarySetting(companyid: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getsalarysettings?companyid=' + companyid);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    updateemployeectcdetail(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/updateemployeectcdetail');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    updateemployeesalarydetails(requestbody: any): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/updateemployeesalarydetails');
        return this.http.post(url, requestbody, {
            headers: this.getHeaders()
        });
    }
    getemployeectcdetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getemployeectcdetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getworkingdaydetailsforpayslip(employee_id: number, month: string, year: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getworkingdaydetailsforpayslip?employee_id=' + employee_id + '&month=' + month + '&year=' + year);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getemployeesalarydetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getemployeesalarydetails?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    getallpayslipdata(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getallpayslipdata?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getcalculatepayroll(createdby: any): Observable<any> {
        const url = this.getRoleBasedUrl(`payroll/calculatepayroll?createdby=` + createdby);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getallsalarydetails(month: string, year: number, companyid: number): Observable<any> {
        const url = this.getRoleBasedUrl('payroll/getallsalarydetails?month=' + month + '&year=' + year + '&companyid=' + companyid);
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // Reports APIs
    getReports(): Observable<any> {
        const url = this.getRoleBasedUrl('getreports');
        return this.http.get(url, { headers: this.getHeaders() });
    }
    // CompanyDetails
    getCompanyDetails(employee_id: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/notifications?employee_id=' + employee_id);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    getcompanyleavesetting(companyid: number): Observable<any> {
        const url = this.getRoleBasedUrl('attendance/getcompanyleavesetting?companyid=' + companyid);
        return this.http.get(url, { headers: this.getHeaders() });
    }
    // Settings APIs
    getSettings(): Observable<any> {
        const url = this.getRoleBasedUrl('getsettings');
        return this.http.get(url, { headers: this.getHeaders() });
    }

    updateSettings(settings: any): Observable<any> {
        const url = this.getRoleBasedUrl('updatesettings');
        return this.http.put(url, settings, { headers: this.getHeaders() });
    }




    // Themes APIs
    getThemes(): Observable<any> {
        const url = this.getRoleBasedUrl('getthemes');
        return this.http.get(url, { headers: this.getHeaders() });
    }

    // Generic API call method
    callApi(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Observable<any> {
        const url = this.getRoleBasedUrl(endpoint);
        const options = { headers: this.getHeaders() };

        switch (method) {
            case 'GET':
                return this.http.get(url, options);
            case 'POST':
                return this.http.post(url, data, options);
            case 'PUT':
                return this.http.put(url, data, options);
            case 'DELETE':
                return this.http.delete(url, options);
            default:
                return this.http.get(url, options);
        }
    }
}
