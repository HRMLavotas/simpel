/**
 * Type definitions for Chart components
 */

export interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface BarChartDataItem {
  name: string;
  count: number;
  type?: string;
  [key: string]: string | number | undefined;
}

export interface PieChartDataItem {
  name: string;
  value: number;
  fill?: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: ChartDataItem;
  }>;
  label?: string;
  totalData?: number;
}

export interface YAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string | number;
  };
}

export interface LegendFormatterEntry {
  value: string;
  type?: string;
  color?: string;
  payload?: ChartDataItem;
}
