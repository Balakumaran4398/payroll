import { Component, OnInit } from '@angular/core';

interface DepartmentSummary {
  name: string;
  monthlyCost: number;
  teamSize: number;
  accent: string;
}

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  searchTerm = '';
  costFilter = 'all';
  readonly activeHighlight = 'Product';
  readonly costFilters = [
    { value: 'all', label: 'All Costs' },
    { value: 'under-250', label: 'Under $250k' },
    { value: '250-400', label: '$250k - $400k' },
    { value: 'over-400', label: 'Over $400k' },
  ];

  readonly departments: DepartmentSummary[] = [
    { name: 'Engineering', monthlyCost: 603000, teamSize: 5, accent: '#5b6cff' },
    { name: 'Finance', monthlyCost: 388000, teamSize: 3, accent: '#3b82f6' },
    { name: 'HR', monthlyCost: 177000, teamSize: 2, accent: '#ec4899' },
    { name: 'Marketing', monthlyCost: 270000, teamSize: 4, accent: '#f59e0b' },
    { name: 'Product', monthlyCost: 348000, teamSize: 3, accent: '#8b5cf6' },
    { name: 'Sales', monthlyCost: 382000, teamSize: 4, accent: '#10b981' },
  ];

  constructor() { }

  ngOnInit(): void {
  }

  get filteredDepartments(): DepartmentSummary[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.departments.filter((department) => {
      const matchesSearch = !search || department.name.toLowerCase().includes(search);
      const matchesCost =
        this.costFilter === 'all' ||
        (this.costFilter === 'under-250' && department.monthlyCost < 250000) ||
        (this.costFilter === '250-400' && department.monthlyCost >= 250000 && department.monthlyCost <= 400000) ||
        (this.costFilter === 'over-400' && department.monthlyCost > 400000);

      return matchesSearch && matchesCost;
    });
  }

  get maxMonthlyCost(): number {
    return Math.max(...this.departments.map((department) => department.monthlyCost), 0);
  }

  get axisLabels(): number[] {
    const max = 800000;
    return [0, 200000, 400000, 600000, max];
  }

  getBarWidth(monthlyCost: number): number {
    const max = this.maxMonthlyCost || 1;
    return Math.max((monthlyCost / max) * 100, 12);
  }

  isHighlightedDepartment(name: string): boolean {
    return name === this.activeHighlight;
  }
}
