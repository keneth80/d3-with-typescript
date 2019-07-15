import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { ChartBase, Scale } from './chart-base';
import { ISeries } from './series.interface';

export class SeriesBase implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    constructor() { }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get $currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>) {

    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {

    }
}