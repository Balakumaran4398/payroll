import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { RoleGuard } from './core/guards/role.guard';
import { AuthGuard } from './core/guards/auth.guard';

const loadAuthModule = () =>
  import('./features/auth/auth.module').then((m) => m.AuthModule);

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: loadAuthModule,
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'users',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('./features/users/users.module').then((m) => m.UsersModule),
      },
      {
        path: 'company',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/company/company.module').then((m) => m.CompanyModule),
      },
      {
        path: 'departments',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER'] },
        loadChildren: () =>
          import('./features/departments/departments.module').then(
            (m) => m.DepartmentsModule
          ),
      },
      {
        path: 'employee',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/employee/employee.module').then(
            (m) => m.EmployeeModule
          ),
      },
      {
        path: 'attendance',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/attendance/attendance.module').then(
            (m) => m.AttendanceModule
          ),
      },
      {
        path: 'reports',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/reports/reports.module').then(
            (m) => m.ReportsModule
          ),
      },
      {
        path: 'settings',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/settings/settings.module').then(
            (m) => m.SettingsModule
          ),
      },
      {
        path: 'themes',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/themes/themes.module').then((m) => m.ThemesModule),
      },
      {
        path: 'documents',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COMPANY', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'] },
        loadChildren: () =>
          import('./features/documents/documents.module').then((m) => m.DocumentsModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadChildren: loadAuthModule,
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
