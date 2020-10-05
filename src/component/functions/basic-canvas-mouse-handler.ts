import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';
import { min, max } from 'd3-array';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { FunctionsBase } from '../chart/functions-base';
import { ChartBase } from '../chart/chart-base';
import { Direction, ScaleType, Placement } from '../chart/chart-configuration';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface BasicCanvasMouseHandlerConfiguration {
    isMoveEvent?: boolean;
    delayTime?: number;
}

export class BasicCanvasMouseHandler extends FunctionsBase {
    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private isMoveEvent = false;

    private move$: Subject<[number, number]> = new Subject();

    private delayTime = 100;

    constructor(configuration: BasicCanvasMouseHandlerConfiguration) {
        super();
        if (configuration) {
            if (configuration.hasOwnProperty('isMoveEvent')) {
                this.isMoveEvent = configuration.isMoveEvent;
            }

            if (configuration.hasOwnProperty('delayTime')) {
                this.delayTime = configuration.delayTime;
            }
        }

        this.addEvent();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        const parentElement = select((this.svg.node() as HTMLElement).parentNode as any);
        if (!parentElement.select('.' + ChartBase.POINTER_CANVAS).node()) {
            this.pointerCanvas = parentElement
                .append('canvas')
                .attr('class', ChartBase.POINTER_CANVAS)
                .style('z-index', index + 20)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = parentElement.select('.' + ChartBase.POINTER_CANVAS);
        }
    }

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        this.setContainerPosition(geometry, this.chartBase);
        
        if (this.isMoveEvent) {
            this.pointerCanvas.on('mousemove', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                this.move$.next(mouseEvent);
            });
        }

        this.pointerCanvas
        .on('mouseleave', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mouseleave',
                position: mouseEvent,
                target: this.pointerCanvas
            });
        })
        .on('mousedown', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mousedown',
                position: mouseEvent,
                target: this.pointerCanvas
            });
        })
        .on('mouseup', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mouseup',
                position: mouseEvent,
                target: this.pointerCanvas
            });
        });
        
    }

    destroy() {
        this.subscription.unsubscribe();
        this.pointerCanvas.remove();
    }

    private addEvent() {
        this.subscription.add(
            this.move$.pipe(debounceTime(this.delayTime)).subscribe((value: [number, number]) => {
                this.chartBase.mouseEventSubject.next({
                    type: 'mousemove',
                    position: value,
                    target: this.pointerCanvas
                })
            })
        );
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
    }
}