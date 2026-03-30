import { Directive, ElementRef, Input, OnInit } from '@angular/core';

declare var Chart: any;

@Directive({
  selector: '[appChart]'
})
export class ChartDirective implements OnInit {
  @Input() data: any;
  @Input() options: any;
  @Input() type: string = 'line';

  private chart: any;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (this.data && this.el.nativeElement) {
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
  }

  private createChart(): void {
    try {
      if (this.chart) {
        this.chart.destroy();
      }

      const canvas = this.el.nativeElement as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      this.chart = new Chart(ctx, {
        type: this.type,
        data: this.data,
        options: this.options || {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }
}
