export type HolidayType = 'national' | 'religious' | 'company';

export interface HolidayRecord {
  id: number;
  companyid: number;
  date: string;
  name: string;
  type: HolidayType;
  description: string;
  createdby: string;
  holidayid?: number;
}

export interface HolidayRecord_1 {
  companyid: number;
  title: string;
  holiday_date: string;
  type: HolidayType;
  remarks: string;
  createdby: string;
  id?: number;

}
export interface HolidayDelete {
  id: number;
  createdby: string;
}

export interface HolidayFormDialogData {
  mode: 'add' | 'edit';
  holiday?: HolidayRecord;
  year: number;
}

export interface HolidayFormDialogResult {
  reload: boolean;
  message?: string;
}

export interface HolidayDeleteDialogData {
  holiday: HolidayRecord;
}

export interface HolidayDeleteDialogResult {
  deleted: boolean;
  message?: string;
}

export interface WeekendSettingsPayload {
  companyid: number;
  sunday_off: boolean;
  monday_off: boolean;
  tuesday_off: boolean;
  wednesday_off: boolean;
  thursday_off: boolean;
  friday_off: boolean;
  saturday_off: boolean;
  saturday_type: string;
  createdby: string;
}
