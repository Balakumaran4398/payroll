import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { Employee, EmployeeFormDialogResult, EmployeeFormMode } from '../../employee.types';
import { ApiService } from 'src/app/core/services/api.service';
import { AuthService } from 'src/app/core/services/auth.service';

interface RoleOption {
  id: number;
  name: string;
  value: string;
}


@Component({
  selector: 'app-employee-form-dialog',
  templateUrl: './employee-form-dialog.component.html',
  styleUrls: ['./employee-form-dialog.component.scss'],
})
export class EmployeeFormDialogComponent implements OnInit {
  private readonly drawerCloseDurationMs = 340;
  // private readonly mobilePattern = /^[0-9+\-()\s]{7,15}$/;
  private readonly mobilePattern = /^[0-9]{10}$/;
  private readonly allowedEmailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(com|in)$/i;
  readonly genderOptions = ['Male', 'Female', 'Other'];
  readonly bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  // readonly roleOptions = ['Manager','Employee'];
  readonly roleOptions: RoleOption[] = [
    { id: 3, name: 'Employee', value: 'ROLE_EMPLOYEE' },
    { id: 4, name: 'Manager', value: 'ROLE_MANAGER' }
  ];

  readonly defaultPositionOptions = [
    'Manager',
    'Employee',
  ];
  readonly title: string;
  readonly actionLabel: string;
  readonly form;
  deptid: any;
  private imagePreviewObjectUrl = '';
  private selectedImagePayload = '';
  private closing = false;
  passwordVisible = false;
  submitting = false;
  departmentMap: Record<string, number> = {};
  designationMap: Record<string, number> = {};
  private lastLoadedDeptId = 0;
  departmentOptions: string[] = [];
  shiftOptions: string[] = [];
  designDepartmentOptions: string[] = [];
  private readonly initialFormValue: Record<string, unknown>;
  readonly positionOptionsByDepartment: Record<string, string[]> = {
    IT: ['Developer', 'QA Engineer', 'Team Lead', 'Support Specialist'],
    HR: ['HR Executive', 'HR Manager', 'Recruiter'],
    Finance: ['Accountant', 'Financial Analyst', 'Payroll Specialist'],
    Operations: ['Operations Executive', 'Process Manager', 'Coordinator'],
    Design: ['UI Designer', 'UX Designer', 'Creative Lead'],
  };
  get currentPositionOptions(): string[] {
    if (this.designDepartmentOptions.length) {
      return this.designDepartmentOptions;
    }

    const selectedDepartment = this.form.get('department_name')?.value as string;
    return this.positionOptionsByDepartment[selectedDepartment] || this.defaultPositionOptions;
  }

  get imagePreview(): string {
    return this.imagePreviewObjectUrl || this.data.employee?.profile_image_url || this.data.employee?.image_url || '';
  }

  constructor(
    private fb: FormBuilder, private apiService: ApiService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: EmployeeFormMode; employee?: Employee },
    private dialogRef: MatDialogRef<EmployeeFormDialogComponent>,
    private feedback: UiFeedbackService
  ) {
    const fullName = [data.employee?.firstname, data.employee?.lastname].filter(Boolean).join(' ');

    this.title = data.mode === 'add' ? 'Add Employee' : `Edit ${fullName ? ' - ' + fullName : ''}`;

    this.actionLabel = data.mode === 'add' ? 'Create Employee' : 'Save Changes';
    this.deptid = data.employee?.deptid;
    const selectedRole = this.resolveRoleOption(data.employee);

    this.form = this.fb.group({
      firstname: [data.employee?.firstname || '', Validators.required],
      lastname: [data.employee?.lastname || '', Validators.required],
      email: [data.employee?.email || '', [Validators.required, Validators.email, this.allowedEmailValidator()]],
      password: [data.employee?.password || '', Validators.required],
      mobile: [data.employee?.mobile || '', [Validators.required, Validators.pattern(this.mobilePattern)]],
      alternate_email: [data.employee?.alternate_email || '', [Validators.email, this.allowedEmailValidator(true)]],
      profile_image_url: [data.employee?.profile_image_url || data.employee?.image_url || ''],
      department_name: [data.employee?.department_name || '', Validators.required],
      position: [data.employee?.position || '', Validators.required],
      role: [selectedRole?.name || data.employee?.role || '', Validators.required],
      roleid: [selectedRole?.id || (data.employee as Employee | undefined)?.roleid || 0],
      shift_type: [data.employee?.shift_type || '', Validators.required],
      joining_date: [this.parseDate(data.employee?.joining_date), Validators.required],
      date_of_birth: [this.parseDate(data.employee?.date_of_birth)],
      gender: [data.employee?.gender || ''],
      blood_group: [data.employee?.blood_group || ''],
      marital_status: [data.employee?.marital_status || ''],
      deptid: [data.employee?.deptid || ''],
      // attendanceid: [data.employee?.attendanceid || 0, Validators.required],
      // managerid: [data.employee?.managerid || 0],
      attendanceid: [data.employee?.attendanceid || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      managerid: [data.employee?.managerid || '', [Validators.pattern(/^[0-9]+$/)]],
      skypeid: [data.employee?.skypeid || ''],
      reference_no: [data.employee?.reference_no || 0],
      wfh: [data.employee?.wfh || false],
      isactive: [data.employee?.isactive ?? true],
    });
    this.initialFormValue = this.form.getRawValue();
  }
  ngOnInit(): void {
    this.allDepartments();
    this.allShifts();
    this.form.get('role')?.valueChanges.subscribe((roleName) => {
      const matchedRole = this.findRoleOption(`${roleName || ''}`);
      this.form.patchValue({ roleid: matchedRole?.id || 0 }, { emitEvent: false });
    });
    this.form.get('department_name')?.valueChanges.subscribe((departmentName) => {
      const departmentId = this.departmentMap[`${departmentName || ''}`] || 0;
      this.form.patchValue({ deptid: departmentId }, { emitEvent: false });

      if (departmentId) {
        this.getDesignationDepartments(departmentId);
      } else {
        this.designDepartmentOptions = [];
        this.designationMap = {};
        this.lastLoadedDeptId = 0;
      }

      const positionControl = this.form.get('position');
      if (!positionControl) {
        return;
      }

      const positionOptions = this.currentPositionOptions;
      if (positionControl.value && !positionOptions.includes(positionControl.value)) {
        positionControl.setValue('');
      }
    });
  }
  allDepartments() {
    this.apiService.getAllDepartments().subscribe((data: any) => {
      const source = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      this.departmentMap = {};
      this.departmentOptions = source
        .map((item) => {
          const name = `${item?.department_name || item?.departmentName || item?.name || ''}`.trim();
          const id = Number(item?.deptid || item?.department_id || item?.id || 0);
          if (name) {
            this.departmentMap[name] = id;
          }
          return name;
        })
        .filter((item) => !!item);

      const currentDepartment = `${this.form.get('department_name')?.value || ''}`;
      const initialDeptId = Number(this.form.get('deptid')?.value) || this.departmentMap[currentDepartment] || Number(this.deptid) || 0;
      if (initialDeptId) {
        this.form.patchValue({ deptid: initialDeptId }, { emitEvent: false });
        this.getDesignationDepartments(initialDeptId);
      }
    });
  }
  allShifts() {
    this.apiService.getAllShifts().subscribe((data: any) => {
      this.shiftOptions = this.extractOptionLabels(data, ['shift_type', 'shiftType', 'name']);
    });
  }
  getDesignationDepartments(deptid?: number) {
    const departmentId = Number(deptid || this.form.get('deptid')?.value || this.deptid || 0);
    if (!departmentId) {
      this.designDepartmentOptions = [];
      this.designationMap = {};
      return;
    }

    if (this.lastLoadedDeptId === departmentId && this.designDepartmentOptions.length) {
      return;
    }

    this.lastLoadedDeptId = departmentId;
    this.apiService.getDesignationDepartments(departmentId).subscribe((data: any) => {
      const source = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      this.designationMap = {};
      this.designDepartmentOptions = source
        .map((item) => {
          const name = `${item?.designation_name || item?.designation || item?.position || item?.name || ''}`.trim();
          const id = Number(item?.designation_id || item?.positionid || item?.id || 0);
          if (name) {
            this.designationMap[name] = id;
          }
          return name;
        })
        .filter((item) => !!item);
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.clearImagePreviewObjectUrl();
    this.imagePreviewObjectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagePayload = typeof reader.result === 'string' ? reader.result : '';
      this.form.patchValue({ profile_image_url: file.name });
      this.form.get('profile_image_url')?.markAsDirty();
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.clearImagePreviewObjectUrl();
    this.selectedImagePayload = '';
    this.form.patchValue({ profile_image_url: '' });
    this.form.get('profile_image_url')?.markAsDirty();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  resetForm(): void {
    this.clearImagePreviewObjectUrl();
    this.selectedImagePayload = '';
    this.form.reset({
      ...this.initialFormValue,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.passwordVisible = false;
  }

  filterOptionsByControl(options: string[], controlName: string): string[] {
    const searchTerm = `${this.form.get(controlName)?.value || ''}`.trim().toLowerCase();
    if (!searchTerm) {
      return options;
    }

    const hasExactMatch = options.some((option) => option.toLowerCase() === searchTerm);
    if (hasExactMatch) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(searchTerm));
  }

  filterRoleOptions(): RoleOption[] {
    const searchTerm = `${this.form.get('role')?.value || ''}`.trim().toLowerCase();
    if (!searchTerm) {
      return this.roleOptions;
    }

    const hasExactMatch = this.roleOptions.some((option) => option.name.toLowerCase() === searchTerm);
    if (hasExactMatch) {
      return this.roleOptions;
    }

    return this.roleOptions.filter((option) =>
      option.name.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm)
    );
  }

  onRoleSelected(roleName: string): void {
    const matchedRole = this.findRoleOption(roleName);
    this.form.patchValue(
      {
        role: matchedRole?.name || roleName,
        roleid: matchedRole?.id || 0,
      },
      { emitEvent: false }
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.data.mode === 'edit' && this.form.pristine && !this.selectedImagePayload) {
      this.feedback.warning('No changes detected to save for this employee.');
      return;
    }

    const employee = this.data.employee;
    const value = this.form.getRawValue();
    const selectedRole = this.findRoleOption(value.role);
    const formattedDob = this.formatDateForPayload(value.date_of_birth) || employee?.date_of_birth || '';
    const formattedJoiningDate = this.formatDateForPayload(value.joining_date);
    const resolvedMaritalStatus = `${value.marital_status || employee?.marital_status || ''}`.trim();
    const resolvedImageUrl = this.resolveImageUrl(value.profile_image_url, employee);
    const resolvedUsername = this.buildUsername(value.email, employee);

    const result: Employee = {
      id: employee?.id || 0,
      firstname: value.firstname || '',
      lastname: value.lastname || '',
      image_url: resolvedImageUrl,
      date_of_birth: formattedDob,
      joining_date: formattedJoiningDate,
      gender: value.gender || '',
      blood_group: value.blood_group || '',
      deptid: Number(value.deptid) || this.departmentMap[value.department_name] || employee?.deptid || 0,
      positionid: this.designationMap[value.position] || this.getOptionIndex(this.currentPositionOptions, value.position) || employee?.positionid || 0,
      shiftid: this.getOptionIndex(this.shiftOptions, value.shift_type) || employee?.shiftid || 0,
      marital_status: resolvedMaritalStatus,
      mobile: value.mobile || '',
      email: value.email || '',
      password: value.password || employee?.password || '',
      alternate_email: value.alternate_email || '',
      skypeid: value.skypeid || '',
      createddate: employee?.createddate || '',
      updateddate: employee?.updateddate || '',
      username: resolvedUsername,
      companyid: employee?.companyid || 0,
      isactive: !!value.isactive,
      isdelete: employee?.isdelete || false,
      attendanceid: Number(value.attendanceid) || employee?.attendanceid || 0,
      managerid: Number(value.managerid) || 0,
      sub_manager_id: employee?.sub_manager_id || null,
      wfh: !!value.wfh,
      releaving_date: employee?.releaving_date || null,
      releaving_remarks: employee?.releaving_remarks || null,
      reference_no: Number(value.reference_no) || 0,
      department_name: value.department_name || '',
      position: value.position || '',
      shift_type: value.shift_type || '',
      role: selectedRole?.name || value.role || '',
      roleid: selectedRole?.id || Number(value.roleid) || employee?.roleid || 0,
      role_value: selectedRole?.value || employee?.role_value || '',
      profile_image_url: resolvedImageUrl,
    };
    if (this.data.mode === 'add') {
      this.saveEmployeeRequest(
        this.apiService.employeeCreate(this.buildCreateRequestBody(result)),
        result,
        'Failed to create employee. Please try again.'
      );
      return;
    }

    this.saveEmployeeRequest(
      this.apiService.employeeUpdate(this.buildUpdateRequestBody(result)),
      result,
      'Failed to update employee. Please try again.'
    );
  }

  close(result?: EmployeeFormDialogResult): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.dialogRef.addPanelClass('employee-dialog-panel--closing');
    window.setTimeout(() => {
      this.dialogRef.close(result);
    }, this.drawerCloseDurationMs);
  }

  hasError(controlName: string, errorName?: string): boolean {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }

    return errorName ? control.hasError(errorName) : control.invalid;
  }

  getErrorMessage(controlName: string, label: string): string {
    const control = this.form.get(controlName);
    if (!control) {
      return '';
    }

    if (control.hasError('required')) {
      return `${label} is required.`;
    }

    if (control.hasError('email')) {
      return `Enter a valid ${label.toLowerCase()}.`;
    }

    if (control.hasError('allowedEmailDomain')) {
      return `${label} must end with .com or .in.`;
    }

    if (control.hasError('pattern') && controlName === 'mobile') {
      return 'Enter a valid mobile number.';
    }

    return `Enter a valid ${label.toLowerCase()}.`;
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private formatDateForPayload(value: unknown): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractOptionLabels(data: any, keys: string[]): string[] {
    const source = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const labels = source
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        const key = keys.find((candidate) => item && item[candidate]);
        return key ? `${item[key]}` : '';
      })
      .filter((item) => !!item);

    return Array.from(new Set(labels));
  }

  private getOptionIndex(options: string[], selectedValue: string): number {
    const index = options.findIndex((item) => item === selectedValue);
    return index >= 0 ? index + 1 : 0;
  }

  private buildCreateRequestBody(result: Employee): Record<string, unknown> {
    return {
      firstname: result.firstname,
      lastname: result.lastname,
      date_of_birth: result.date_of_birth,
      joining_date: result.joining_date,
      gender: result.gender,
      blood_group: result.blood_group,
      deptid: result.deptid,
      positionid: result.positionid,
      shiftid: result.shiftid,
      marital_status: result.marital_status,
      mobile: result.mobile,
      email: result.email,
      alternate_email: result.alternate_email,
      skypeid: result.skypeid || '',
      attendanceid: result.attendanceid,
      password: result.password,
      username: result.username || '',
      image_url: result.image_url || '',
      role: result.role_value || result.role,
      reference_no: result.reference_no,
      join_date: result.joining_date,
      managerid: result.managerid || 0,
      dob: result.date_of_birth,
    };
  }

  private buildUpdateRequestBody(result: Employee): Record<string, unknown> {
    return {
      id: result.id,
      reference_no: result.reference_no,
      firstname: result.firstname,
      lastname: result.lastname,
      image_url: result.image_url || '',
      date_of_birth: result.date_of_birth,
      joining_date: result.joining_date,
      gender: result.gender,
      blood_group: result.blood_group,
      deptid: result.deptid,
      positionid: result.positionid,
      shiftid: result.shiftid,
      companyid: result.companyid || 0,
      marital_status: result.marital_status,
      mobile: result.mobile,
      email: result.email,
      password: result.password,
      alternate_email: result.alternate_email,
      skypeid: result.skypeid || '',
      createddate: result.createddate || '',
      updateddate: result.updateddate || '',
      isactive: result.isactive,
      isdelete: result.isdelete,
      attendanceid: result.attendanceid,
      managerid: result.managerid || 0,
      sub_manager_id: result.sub_manager_id ?? 0,
      wfh: result.wfh,
      releaving_date: result.releaving_date || '',
      releaving_remarks: result.releaving_remarks || '',
      username: result.username || '',
      role: result.role_value || result.role,
    };
  }

  private findRoleOption(roleValue: string): RoleOption | undefined {
    const normalizedRoleValue = `${roleValue || ''}`.trim().toLowerCase();
    if (!normalizedRoleValue) {
      return undefined;
    }

    return this.roleOptions.find((option) =>
      option.name.toLowerCase() === normalizedRoleValue ||
      option.value.toLowerCase() === normalizedRoleValue
    );
  }

  private resolveRoleOption(employee?: Employee): RoleOption | undefined {
    const employeeRoleId = Number(employee?.roleid || 0);
    if (employeeRoleId) {
      const byId = this.roleOptions.find((option) => option.id === employeeRoleId);
      if (byId) {
        return byId;
      }
    }

    return this.findRoleOption(employee?.role || employee?.role_value || '');
  }

  private buildUsername(email: string, employee?: Employee): string {
    const appUsername = `${this.authService.getUsername() || ''}`.trim();
    if (appUsername) {
      return appUsername;
    }

    const normalizedEmail = `${email || ''}`.trim();
    if (normalizedEmail) {
      return normalizedEmail.split('@')[0] || normalizedEmail;
    }

    return employee?.username || '';
  }

  private resolveImageUrl(imageValue: unknown, employee?: Employee): string {
    if (this.selectedImagePayload) {
      return this.selectedImagePayload;
    }

    const candidate = this.normalizeImagePath(imageValue);
    if (candidate) {
      return candidate;
    }

    return this.normalizeImagePath(employee?.image_url || employee?.profile_image_url || '');
  }

  private normalizeImagePath(imageValue: unknown): string {
    const candidate = `${imageValue || ''}`.trim();
    if (!candidate) {
      return '';
    }

    if (candidate.startsWith('data:') || candidate.startsWith('blob:')) {
      return '';
    }

    return candidate;
  }

  private clearImagePreviewObjectUrl(): void {
    if (this.imagePreviewObjectUrl) {
      URL.revokeObjectURL(this.imagePreviewObjectUrl);
      this.imagePreviewObjectUrl = '';
    }
  }

  private saveEmployeeRequest(request$: Observable<any>, fallback: Employee, errorMessage: string): void {
    this.submitting = true;
    request$.pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: (response: any) => {
        this.close({
          employee: this.mapSavedResponse(response, fallback),
          message: this.extractResponseMessage(
            response,
            this.data.mode === 'add'
              ? `${fallback.firstname} ${fallback.lastname} created successfully.`
              : `${fallback.firstname} ${fallback.lastname} updated successfully.`
          ),
        });
      },
      error: (error: any) => {
        const message = error?.error?.message || error?.message || errorMessage;
        this.feedback.error(message);
      },
    });
  }

  private mapSavedResponse(response: any, fallback: Employee): Employee {
    const payload = response?.data || response?.result || response || {};
    const roleOption =
      this.roleOptions.find((option) => option.id === Number(payload?.roleid || payload?.role_id || 0)) ||
      this.findRoleOption(payload?.role || payload?.role_value || fallback.role_value || fallback.role);

    return {
      ...fallback,
      id: Number(payload?.id || payload?.userid || payload?.user_id || fallback.id || 0),
      deptid: Number(payload?.deptid || payload?.department_id || fallback.deptid || 0),
      positionid: Number(payload?.positionid || payload?.designation_id || fallback.positionid || 0),
      shiftid: Number(payload?.shiftid || fallback.shiftid || 0),
      attendanceid: Number(payload?.attendanceid || payload?.biometric_id || fallback.attendanceid || 0),
      reference_no: Number(payload?.reference_no || payload?.referenceid || fallback.reference_no || 0),
      role: roleOption?.name || fallback.role,
      roleid: Number(payload?.roleid || payload?.role_id || roleOption?.id || fallback.roleid || 0),
      role_value: payload?.role || payload?.role_value || roleOption?.value || fallback.role_value,
      // createddate: payload?.createddate || fallback.createddate,
      // updateddate: payload?.updateddate || fallback.updateddate,
    };
  }

  private allowedEmailValidator(allowEmpty = false): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = `${control.value || ''}`.trim();
      if (!value) {
        return allowEmpty ? null : { allowedEmailDomain: true };
      }

      return this.allowedEmailPattern.test(value) ? null : { allowedEmailDomain: true };
    };
  }

  private extractResponseMessage(response: any, fallback: string): string {
    const candidate = `${response?.message || response?.msg || response?.data?.message || ''}`.trim();
    return candidate || fallback;
  }
}
