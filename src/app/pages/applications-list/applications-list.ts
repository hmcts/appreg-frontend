import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './applications-list.html',
  styleUrls: ['./applications-list.scss'],
})
export class ApplicationsList implements OnInit {
  ngOnInit(): void {}
}
