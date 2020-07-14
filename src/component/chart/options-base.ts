import { select, Selection, BaseType } from 'd3-selection';
import { Subject, Observable, Subscription } from 'rxjs';

import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';
import { IOptions } from './options.interface';
import { guid } from './util/d3-svg-util';

export class OptionsBase implements IOptions {
    selector: string;

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected itemClickSubject: Subject<any> = new Subject();

    protected subscription: Subscription = new Subscription();

    private chart: ChartBase;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private maskId = '';

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

    setOptionCanvas(svg: Selection<BaseType, any, HTMLElement, any>) {
        const parentElement = select((svg.node() as HTMLElement).parentElement);

        if(!parentElement.select('.option-canvas').node()) {
            const targetSvg = parentElement.append('svg')
                .attr('class', 'option-canvas')
                .style('z-index', 0)
                .style('position', 'absolute');

            if (!this.clipPath) {
                this.maskId = guid();
                this.clipPath = targetSvg.append('defs')
                    .append('svg:clipPath')
                        .attr('id', this.maskId)
                        .append('rect')
                        .attr('clas', 'option-mask')
                        .attr('x', 0)
                        .attr('y', 0);
            }

            return targetSvg;
        } else {
            return parentElement.select('.option-canvas').style('z-index', 0);
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {

    }

    drawOptions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {

    }

    destroy() {
        this.subscription.unsubscribe();
    }
}