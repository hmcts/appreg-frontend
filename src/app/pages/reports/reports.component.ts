import { AfterViewInit, Component } from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule }             from '@angular/forms';
import { initAll }                 from 'govuk-frontend';
import {FeeReportService} from "../../services/fee-report.service";
import { CourthouseService} from '../../services/courthouse.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  providers: [FeeReportService],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements AfterViewInit {
  selectedReport = '';

  courthouses: any[] = [];
  filteredCourthouses: any[] = [];
  courthouseSearch = '';

  filters = {
    // Required for download API
    startDate: '',
    endDate: '',
    standardApplicantCode: '',
    applicantSurname: '',
    courthouseCode: '',

    // Bound to day/month/year fields for UI entry
    startDay: '',
    startMonth: '',
    startYear: '',
    endDay: '',
    endMonth: '',
    endYear: ''
  };

  constructor(
    private reportService: FeeReportService,
    private courthouseService: CourthouseService
  ) {}

  ngOnInit(): void {
    this.courthouseService.getCourthouses().subscribe(data => {
      this.courthouses = data;
      this.filteredCourthouses = data;
    });
  }

  ngAfterViewInit(): void {
    initAll();
  }

  onCourthouseInputChange(): void {
    const searchTerm = this.courthouseSearch.toLowerCase();
    this.filteredCourthouses = this.courthouses.filter(c =>
      c.name.toLowerCase().includes(searchTerm)
    );
  }

  selectCourthouse(courthouse: any): void {
    console.log('Selected courthouse:', courthouse);
    this.filters.courthouseCode = courthouse.courtLocationCode ?? '';
    this.courthouseSearch = courthouse.name;
    this.filteredCourthouses = [];
  }

  private pad(value: string | number): string {
    return value.toString().padStart(2, '0');
  }

  private isDateComplete(day: string, month: string, year: string): boolean {
    return !!(day && month && year);
  }

  private buildIsoDate(day: string, month: string, year: string): string {
    return `${year}-${this.pad(month)}-${this.pad(day)}`;
  }

  download(): void {
    if (this.selectedReport !== 'fees') {
      alert('Please select the "Fees" report to download.');
      return;
    }

    if (!this.isDateComplete(this.filters.startDay, this.filters.startMonth, this.filters.startYear) ||
      !this.isDateComplete(this.filters.endDay, this.filters.endMonth, this.filters.endYear)) {
      alert('Start and end dates are required.');
      return;
    }

    this.filters.startDate = this.buildIsoDate(this.filters.startDay, this.filters.startMonth, this.filters.startYear);
    this.filters.endDate = this.buildIsoDate(this.filters.endDay, this.filters.endMonth, this.filters.endYear);

    console.log('Selected filters:', this.filters); // optional debug

    this.reportService.downloadReport(this.filters).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fee-report.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }, err => {
      console.error('Failed to download fee report', err);
      alert('Failed to download report. Please check the filters and try again.');
    });
  }
}
