import type { HeatmapMetric } from '../types/electionGis.types';

export class MapService {
  /**
   * Build an offline, tile-free MapLibre GL Style Specification.
   * Soft oceanic background (#dbeafe / #e0f2fe) giving realistic subcontinental cartography!
   */
  createLocalVectorStyle(backgroundColor: string = '#dbeafe'): any {
    return {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'offline-background',
          type: 'background',
          paint: {
            'background-color': backgroundColor,
          },
        },
      ],
    };
  }

  /**
   * Build dynamic MapLibre color expression for any of the 8 Election Heatmap Metrics.
   * All color stops explicitly use to-color for 100% MapLibre GL specification compliance!
   */
  getColorExpression(metric: HeatmapMetric): any {
    switch (metric) {
      case 'turnout':
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'turnout_num']], 65],
          42, ['to-color', '#ef4444'],
          52, ['to-color', '#f97316'],
          62, ['to-color', '#eab308'],
          72, ['to-color', '#84cc16'],
          82, ['to-color', '#10b981'],
          90, ['to-color', '#047857'],
        ];

      case 'margin':
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'margin_num']], 10],
          0, ['to-color', '#f43f5e'],
          5, ['to-color', '#fb923c'],
          10, ['to-color', '#38bdf8'],
          20, ['to-color', '#6366f1'],
          35, ['to-color', '#4338ca'],
        ];

      case 'winning_party':
      case 'leading_party':
        return [
          'match',
          ['coalesce', ['get', 'winning_party'], 'Others'],
          'BJP', '#ea580c',
          'Bharatiya Janata Party', '#ea580c',
          'INC', '#0284c7',
          'Indian National Congress', '#0284c7',
          'AITC', '#16a34a',
          'TMC', '#16a34a',
          'All India Trinamool Congress', '#16a34a',
          'AAP', '#06b6d4',
          'Aam Aadmi Party', '#06b6d4',
          'SP', '#ef4444',
          'Samajwadi Party', '#ef4444',
          'DMK', '#dc2626',
          'Dravida Munnetra Kazhagam', '#dc2626',
          'TDP', '#f59e0b',
          'Telugu Desam Party', '#f59e0b',
          'YSRCP', '#2563eb',
          'YSR Congress Party', '#2563eb',
          'Shiv Sena', '#f97316',
          'SHS', '#f97316',
          'Shiv Sena (UBT)', '#f97316',
          'NCP', '#7c3aed',
          'Nationalist Congress Party', '#7c3aed',
          'BSP', '#3b82f6',
          'Bahujan Samaj Party', '#3b82f6',
          'CPI', '#b91c1c',
          'CPM', '#b91c1c',
          'Communist Party of India', '#b91c1c',
          /* Default: gracefully preserve GeoJSON fill_color or soft purple fallback */
          ['coalesce', ['get', 'fill_color'], '#8b5cf6'],
        ];

      case 'vote_share':
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'vote_share_num']], 50],
          25, ['to-color', '#fed7aa'],
          35, ['to-color', '#fba765'],
          45, ['to-color', '#f97316'],
          55, ['to-color', '#ea580c'],
          65, ['to-color', '#9a3412'],
        ];

      case 'total_votes':
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'total_votes_num']], 1200000],
          400000, ['to-color', '#e0e7ff'],
          800000, ['to-color', '#a5b4fc'],
          1200000, ['to-color', '#6366f1'],
          1600000, ['to-color', '#4338ca'],
          2200000, ['to-color', '#312e81'],
        ];

      case 'nota_votes':
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'nota_pct_num']], 1.5],
          0.5, ['to-color', '#fef08a'],
          1.5, ['to-color', '#f97316'],
          2.5, ['to-color', '#dc2626'],
          4.0, ['to-color', '#7f1d1d'],
        ];

      case 'custom_metric':
      default:
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', 'custom_metric_num']], 50],
          0, ['to-color', '#fee2e2'],
          25, ['to-color', '#fca5a5'],
          50, ['to-color', '#f87171'],
          75, ['to-color', '#ef4444'],
          100, ['to-color', '#991b1b'],
        ];
    }
  }
}

export const mapService = new MapService();
export default mapService;
