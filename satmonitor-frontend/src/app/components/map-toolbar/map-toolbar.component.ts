import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export type MapToolType = 'none' | 'search-data' | 'layer-management' | 'export-data';

@Component({
  selector: 'app-map-toolbar',
  template: `
    <div class="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow p-3">
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        [ngClass]="{
          'bg-blue-500 text-white': activeTool === 'search-data',
          'hover:bg-gray-100 text-gray-700': activeTool !== 'search-data'
        }"
        (click)="selectTool('search-data')"
        title="Rechercher et visualiser les données satellite"
      >
        Chercher les données
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        [ngClass]="{
          'bg-blue-500 text-white': activeTool === 'layer-management',
          'hover:bg-gray-100 text-gray-700': activeTool !== 'layer-management'
        }"
        (click)="selectTool('layer-management')"
        title="Gérer les couches cartographiques"
      >
        Gérer les couches
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        [ngClass]="{
          'bg-blue-500 text-white': activeTool === 'export-data',
          'hover:bg-gray-100 text-gray-700': activeTool !== 'export-data'
        }"
        (click)="selectTool('export-data')"
        title="Exporter les données et la carte"
      >
        Exporter les données
      </button>

      <div *ngIf="activeTool && activeTool !== 'none'" class="ml-auto text-xs text-gray-600 italic">
        {{ getToolLabel() }}
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MapToolbarComponent implements OnInit {
  @Input() activeTool: MapToolType = 'none';
  @Output() toolChanged = new EventEmitter<MapToolType>();

  selectTool(tool: MapToolType): void {
    this.activeTool = this.activeTool === tool ? 'none' : tool;
    this.toolChanged.emit(this.activeTool);
  }

  getToolLabel(): string {
    const labels: Record<MapToolType, string> = {
      'none': '',
      'search-data': 'Sélectionnez une source de données et un intervalle de dates',
      'layer-management': 'Activez, désactivez et gérez les couches visibles',
      'export-data': 'Téléchargez les données et les images cartographiques',
    };
    return labels[this.activeTool] || '';
  }

  ngOnInit(): void {}
}
