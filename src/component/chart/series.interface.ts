import { Selection, BaseType } from 'd3-selection';
import { BasicLineSeries, GroupedVerticalBarSeries } from '../series';
import { ChartBase } from './chart-base';
import { Scale, DisplayOption, ContainerSize } from './chart.interface';


export enum SeriesType {
    SVG_LINE = 'BasicLineSeries',
    SVG_VERTICAL_BAR = 'GroupedVerticalBarSeries',
    SVG_AREA = 'BasicAreaSeries'
}

export interface SeriesConfiguration {
    type?: SeriesType; // line, bar, plot, area....
    selector?: string; // series group의 class 명
    displayName?: string; // 해당 series display 명칭 (legend에서도 사용)
    shape?: string; // legend에서 출력될 때 icon 모양
    filter?: any; // data filter function
    xDirection?: string; // bottom or top
    yDirection?: string; // left or right
}

export interface ISeries<T = any> {
    type: string;

    chartBase: ChartBase; // series 내부에서 차트를 참조할 수 있도록 함.

    displayName: string; // legend 출력시 출력 명칭

    displayNames: string[]; // legend 출력시 출력 명칭 (staced, grouped 등 시리즈 하나로 처리할 경우 쓰는 변수.)

    shape: string; // legend 출력 시 색상아이템의 type

    selector: string; // legend 출력시 출력 명칭이 없으면 selector로 보여줌.

    changeConfiguration(configuration: SeriesConfiguration): void;

    select(displayName: string, isSelected: boolean): void; // 해당 series 선택 메서드

    hide(displayName: string, isHide: boolean): void; // 해당 series hidden show 기능 메서드

    unSelectItem(): void;

    destroy(): void;

    getSeriesDataByPosition(value: number[]): any;

    showPointAndTooltip(value: number[], selected: any[]): number;

    onSelectItem(value: number[], selected: any[]): void;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, seriesGroup: Selection<BaseType, any, HTMLElement, any>, index: number): void;
    // series 최초 생성 시 svg element, series 출력 영역, series index를 해당 메서드를 통해 인자값으로 내려줌.

    drawSeries(data: T[], scales: Scale[], geometry: ContainerSize, displayOption: DisplayOption): void;
    // drawSeries(data: Array<T>, scales: Array<Scale>, geometry: ContainerSize, index: number, sereisColor: string): void;
    // chart container의 사이즈가 변경 되거나 다시 display 될 때 호출되는 메서드로 chart data, scale, series 영역의 사이즈, series index, series color를 해당 메서드를 통해 인자값으로 내려줌.
}