export interface Employee {
  id: number;
  firstname: string;
  lastname: string;
  image_url: string;
  date_of_birth: string;
  joining_date: string;
  gender: string;
  blood_group: string;
  deptid: number;
  positionid: number;
  shiftid: number;
  marital_status: string;
  mobile: string;
  email: string;
  password: string;
  alternate_email: string;
  skypeid: string;
  createddate: string;
  updateddate: string;
  username?: string;
  companyid?: number;
  isactive: boolean;
  isdelete: boolean;
  attendanceid: number;
  managerid: number;
  sub_manager_id: number | null;
  wfh: boolean;
  releaving_date: string | null;
  releaving_remarks: string | null;
  reference_no: number;
  department_name: string;
  position: string;
  shift_type: string;
  role: string;
  roleid?: number;
  role_value?: string;
  profile_image_url: string;
}

export interface EmployeeFormDialogResult {
  employee: Employee;
  message?: string;
}

export type EmployeeFormMode = 'add' | 'edit';
