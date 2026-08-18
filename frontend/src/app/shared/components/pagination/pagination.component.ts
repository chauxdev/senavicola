import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <div class="pagination-container">
        <div class="pagination-info">
          Mostrando página {{ currentPage }} de {{ totalPages }} (Total: {{ totalItems }})
        </div>
        <div class="pagination-controls">
          <button 
            class="btn-page" 
            [disabled]="currentPage === 1" 
            (click)="onPageChange(currentPage - 1)">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          
          <span class="page-numbers">
            @for (page of pagesArray; track page) {
              <button 
                class="btn-page-num" 
                [class.active]="page === currentPage"
                (click)="onPageChange(page)">
                {{ page }}
              </button>
            }
          </span>

          <button 
            class="btn-page" 
            [disabled]="currentPage === totalPages" 
            (click)="onPageChange(currentPage + 1)">
            Siguiente <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--gray-medium, #e0e0e0);
      margin-top: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .pagination-info {
      font-size: 1.3rem;
      color: var(--gray-dark, #666);
    }
    .pagination-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .btn-page {
      padding: 0.8rem 1.5rem;
      background: white;
      border: 1px solid var(--gray-medium, #e0e0e0);
      border-radius: 6px;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--gray-dark, #333);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-page:hover:not(:disabled) {
      background: var(--gray-light, #f5f5f5);
      color: var(--primary-green, #39a900);
      border-color: var(--primary-green, #39a900);
    }
    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .page-numbers {
      display: flex;
      gap: 0.3rem;
    }
    .btn-page-num {
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid var(--gray-medium, #e0e0e0);
      border-radius: 6px;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--gray-dark, #333);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-page-num:hover {
      background: var(--gray-light, #f5f5f5);
    }
    .btn-page-num.active {
      background: var(--primary-green, #39a900);
      color: white;
      border-color: var(--primary-green, #39a900);
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Output() pageChange = new EventEmitter<number>();

  get pagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
