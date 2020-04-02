import { Selection, BaseType } from 'd3-selection';
import { Scale, ChartBase } from './chart-base';

export interface SeriesConfiguration {
    selector?: string;
    displayName?: string;
    shape?: string;
}

export interface ISeries<T = any> {
    chartBase: ChartBase;

    displayName: string; // legend 출력시 출력 명칭

    shape: string; // legend 출력 시 색상아이템의 type

    selector: string;

    select(displayName: string, isSelected: boolean): void;

    hide(displayName: string, isHide: boolean): void;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>): void;

    drawSeries(data: Array<T>, scales: Array<Scale>, width: number, height: number, index: number, sereisColor: string): void;
}