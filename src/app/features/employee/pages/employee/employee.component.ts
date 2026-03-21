import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort, SortDirection } from '@angular/material/sort';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import { Employee, EmployeeFormMode } from '../../employee.types';
import { EmployeeProfileDialogComponent } from '../../components/employee-profile-dialog/employee-profile-dialog.component';
import { EmployeeFormDialogComponent } from '../../components/employee-form-dialog/employee-form-dialog.component';
import { EmployeeDeleteDialogComponent } from '../../components/employee-delete-dialog/employee-delete-dialog.component';

interface EmployeeFormDialogResult {
  employee: Employee;
  message?: string;
}

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  pagedEmployees: Employee[] = [];
  loading = false;
  departmentList: any;
  ShiftsList: any;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  readonly pageSizeOptions = [10, 20, 50];
  pageSize = 10;
  pageIndex = 0;
  sortActive = 'profile';
  sortDirection: SortDirection = 'asc';
  readonly deletingEmployeeIds = new Set<number>();

  displayedColumns: string[] = ['profile', 'contact', 'department', 'personal', 'employment', 'actions'];

  get totalEmployees(): number {
    return this.employees.length;
  }

  get activeEmployees(): number {
    return this.employees.filter((emp) => emp.isactive).length;
  }

  get inactiveEmployees(): number {
    return this.employees.filter((emp) => !emp.isactive).length;
  }

  get hasEmployees(): boolean {
    return this.employees.length > 0;
  }

  get hasVisibleEmployees(): boolean {
    return this.filteredEmployees.length > 0;
  }

  get isFilterApplied(): boolean {
    return this.statusFilter !== 'all' || !!this.searchTerm.trim();
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private feedback: UiFeedbackService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const resolvedData = this.route.snapshot.data['employeeData'];
    if (resolvedData) {
      this.employees = resolvedData;
      this.applyFilters();
      return;
    }

    this.loadEmployeeList();
 
  }

  loadEmployeeList(): void {
    this.loading = true;
    this.apiService.getEmployeeList().subscribe({
      next: (data) => {
        this.employees = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loadSampleData();
        this.feedback.warning('Live employee data could not be loaded. Sample data is shown instead.');
        this.loading = false;
      },
    });
  }

  private loadSampleData(): void {
    this.employees = [
      {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        image_url: '',
        date_of_birth: '1990-01-01',
        joining_date: '2020-01-01',
        gender: 'Male',
        blood_group: 'O+',
        deptid: 1,
        positionid: 1,
        shiftid: 1,
        marital_status: 'Single',
        mobile: '1234567890',
        email: 'john.doe@example.com',
        password: '',
        alternate_email: 'john.doe@personalmail.com',
        skypeid: 'john.doe',
        createddate: '2020-01-01',
        updateddate: '2023-01-01',
        isactive: true,
        isdelete: false,
        attendanceid: 1,
        managerid: 1,
        sub_manager_id: null,
        wfh: false,
        releaving_date: null,
        releaving_remarks: null,
        reference_no: 1,
        department_name: 'IT',
        position: 'Developer',
        shift_type: 'Morning',
        role: 'Developer',
        profile_image_url: '',
      },
      {
        id: 2,
        firstname: 'Jane',
        lastname: 'Smith',
        image_url: '',
        date_of_birth: '1985-05-15',
        joining_date: '2019-03-01',
        gender: 'Female',
        blood_group: 'A+',
        deptid: 2,
        positionid: 2,
        shiftid: 1,
        marital_status: 'Married',
        mobile: '0987654321',
        email: 'jane.smith@example.com',
        password: '',
        alternate_email: 'jane.smith@personalmail.com',
        skypeid: 'jane.smith',
        createddate: '2019-03-01',
        updateddate: '2023-01-01',
        isactive: true,
        isdelete: false,
        attendanceid: 2,
        managerid: 2,
        sub_manager_id: null,
        wfh: true,
        releaving_date: null,
        releaving_remarks: null,
        reference_no: 2,
        department_name: 'HR',
        position: 'Manager',
        shift_type: 'Morning',
        role: 'Manager',
        profile_image_url: '',
      },
    ];
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = filter;
    this.applyFilters();
  }

  onSortChange(sort: Sort): void {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction || 'asc';
    this.updateTableView(true);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateTableView();
  }

  private applyFilters(): void {
    let filtered = [...this.employees];

    if (this.statusFilter === 'active') {
      filtered = filtered.filter((emp) => emp.isactive);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter((emp) => !emp.isactive);
    }

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((employee) => this.matchesSearch(employee, search));
    }

    this.filteredEmployees = filtered;
    this.updateTableView(true);
  }

  private updateTableView(resetPageIndex = false): void {
    if (resetPageIndex) {
      this.pageIndex = 0;
    }

    const sortedEmployees = this.getSortedEmployees(this.filteredEmployees);
    const safePageIndex = this.getSafePageIndex(sortedEmployees.length);

    if (safePageIndex !== this.pageIndex) {
      this.pageIndex = safePageIndex;
    }

    const startIndex = this.pageIndex * this.pageSize;
    this.pagedEmployees = sortedEmployees.slice(startIndex, startIndex + this.pageSize);
  }

  private getSafePageIndex(totalItems: number): number {
    if (!totalItems) {
      return 0;
    }

    const maxPageIndex = Math.max(Math.ceil(totalItems / this.pageSize) - 1, 0);
    return Math.min(this.pageIndex, maxPageIndex);
  }

  private getSortedEmployees(employees: Employee[]): Employee[] {
    if (!this.sortActive || !this.sortDirection) {
      return [...employees];
    }

    const direction = this.sortDirection === 'desc' ? -1 : 1;

    return [...employees].sort((left, right) => {
      const leftValue = this.getSortValue(left, this.sortActive);
      const rightValue = this.getSortValue(right, this.sortActive);

      if (leftValue < rightValue) {
        return -1 * direction;
      }

      if (leftValue > rightValue) {
        return 1 * direction;
      }

      return 0;
    });
  }

  private getSortValue(employee: Employee, column: string): string | number {
    switch (column) {
      case 'profile':
        return `${employee.firstname || ''} ${employee.lastname || ''}`.trim().toLowerCase();
      case 'contact':
        return (employee.email || employee.mobile || '').toLowerCase();
      case 'department':
        return `${employee.department_name || ''} ${employee.position || ''}`.trim().toLowerCase();
      case 'personal':
        return employee.date_of_birth || '';
      case 'employment':
        return employee.joining_date || '';
      default:
        return '';
    }
  }

  private matchesSearch(employee: Employee, search: string): boolean {
    const searchableFields = [
      employee.firstname,
      employee.lastname,
      employee.email,
      employee.mobile,
      employee.department_name,
      employee.position,
      employee.shift_type,
      employee.role,
      employee.alternate_email,
      // employee.skypeid,
      employee.marital_status,
      employee.blood_group,
      employee.gender,
    ].filter((field) => field);

    return searchableFields.some((field) => field.toLowerCase().includes(search));
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Not available';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getEmployeeImage(employee: Employee): string | SafeUrl {
    return employee.profile_image_url || employee.image_url || this.getFallbackAvatar(employee);
  }

  onImageError(event: Event, employee?: Employee): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.getFallbackAvatarUrl(employee);
    }
  }

  openProfileDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeProfileDialogComponent, {
      width: '680px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-profile-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: {
        employee,
        imageUrl: this.getEmployeeImage(employee),
      },
    });
  }

  openAddEmployeeDialog(): void {
    this.openEmployeeFormDialog('add');
  }

  viewEmployeeDetails(employee: Employee): void {
    this.openProfileDialog(employee);
  }

  editEmployee(employee: Employee): void {
    this.openEmployeeFormDialog('edit', employee);
  }

  deleteEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDeleteDialogComponent, {
      width: '460px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-delete-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: { employee },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.runDeleteEmployee(employee);
    });
  }

  refreshData(): void {
    this.loadEmployeeList();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  private openEmployeeFormDialog(mode: EmployeeFormMode, employee?: Employee): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '580px',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: ['employee-dialog-panel', 'employee-form-modal-panel'],
      position: {
        top: '64px',
        right: '0',
      },
      hasBackdrop: true,
      backdropClass: 'employee-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: { mode, employee },
    });

    dialogRef.afterClosed().subscribe((result?: EmployeeFormDialogResult) => {
      if (!result) {
        return;
      }

      const savedEmployee = result.employee;

      if (mode === 'add') {
        const nextId = this.employees.length ? Math.max(...this.employees.map((item) => item.id)) + 1 : 1;
        const newEmployee: Employee = {
          ...savedEmployee,
          id: savedEmployee.id || nextId,
          deptid: savedEmployee.deptid || nextId,
          positionid: savedEmployee.positionid || nextId,
          shiftid: savedEmployee.shiftid || 1,
          attendanceid: savedEmployee.attendanceid || nextId,
          reference_no: savedEmployee.reference_no || nextId,
        };

        this.employees = [newEmployee, ...this.employees];
        this.feedback.success(result.message || `${newEmployee.firstname} ${newEmployee.lastname} created successfully.`);
      } else if (employee) {
        const updatedEmployee: Employee = {
          ...employee,
          ...savedEmployee,
        };

        this.employees = this.employees.map((item) => (item.id === employee.id ? updatedEmployee : item));
        this.feedback.success(result.message || `${updatedEmployee.firstname} ${updatedEmployee.lastname} updated successfully.`);
      }

      this.apiService.setEmployeeListCache(this.employees);
      this.applyFilters();
    });
  }

  isEmployeeDeleting(employeeId: number): boolean {
    return this.deletingEmployeeIds.has(employeeId);
  }

  private getFallbackAvatar(employee?: Employee): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.getFallbackAvatarUrl(employee));
  }

  private getFallbackAvatarUrl(employee?: Employee): string {
    const initials = `${employee?.firstname?.charAt(0) || ''}${employee?.lastname?.charAt(0) || ''}`.trim() || 'HR';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#1d5c63"/>
            <stop offset="100%" stop-color="#102132"/>
          </linearGradient>
        </defs>
        <rect width="320" height="320" rx="42" fill="url(#g)"/>
        <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-family="'Plus Jakarta Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="120" font-weight="700">${initials.toUpperCase()}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private runDeleteEmployee(employee: Employee): void {
    const employeeId = employee.id;
    if (!employeeId) {
      this.feedback.error('Unable to delete this employee because the employee id is missing.');
      return;
    }

    this.deletingEmployeeIds.add(employeeId);
    const username = `${this.authService.getUsername() || ''}`.trim();

    this.apiService
      .getDeleteEmployee(employeeId, username)
      .pipe(
        finalize(() => {
          this.deletingEmployeeIds.delete(employeeId);
        })
      )
      .subscribe({
        next: (response) => {
          this.employees = this.employees.filter((item) => item.id !== employeeId);
          this.apiService.setEmployeeListCache(this.employees);
          this.applyFilters();
          this.feedback.success(this.extractResponseMessage(response, `${employee.firstname} ${employee.lastname} deleted successfully.`));
        },
        error: (error) => {
          this.feedback.error(
            error?.error?.message || error?.message || `Failed to delete ${employee.firstname} ${employee.lastname}. Please try again.`
          );
        },
      });
  }

  private extractResponseMessage(response: any, fallback: string): string {
    const candidate = `${response?.message || response?.msg || response?.data?.message || ''}`.trim();
    return candidate || fallback;
  }
}
