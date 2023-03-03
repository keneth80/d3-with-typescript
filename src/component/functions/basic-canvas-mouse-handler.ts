import {Selection, BaseType, pointer} from 'd3-selection';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {Scale, ContainerSize} from '../chart/chart.interface';
import {FunctionsBase} from '../chart/functions-base';
import {ChartBase, ChartSelector} from '../chart';

export interface BasicCanvasMouseHandlerConfiguration {
    isMoveEvent?: boolean;
    delayTime?: number;
}

export class BasicCanvasMouseHandler extends FunctionsBase {
    protected pointerCanvas: Selection<any, any, HTMLElement, any>;

    private isMoveEvent = false;

    private move$: Subject<[number, number]> = new Subject();

    private delayTime = 30;

    private moveSubscription: Subscription;

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

        // this.addEvent();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        if (!this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS).node()) {
            this.pointerCanvas = this.chartBase.chartContainer
                .append('canvas')
                .attr('class', ChartSelector.POINTER_CANVAS)
                .style('z-index', index + 20)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS);
        }
    }

    drawFunctions(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        this.setContainerPosition(geometry, this.chartBase);
        this.disable();
        this.enable(chartData, scales, geometry);
    }

    enable(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        if (this.isEnable) {
            return;
        }

        this.isEnable = true;
        this.addEvent();

        if (this.isMoveEvent) {
            this.pointerCanvas.on('mousemove', () => {
                const mouseEvent = pointer(this.pointerCanvas.node() as any);
                this.move$.next(mouseEvent);
            });
        }

        this.pointerCanvas
            .on('mouseleave', () => {
                const mouseEvent = pointer(this.pointerCanvas.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'mouseleave',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            })
            .on('mousedown', () => {
                const mouseEvent = pointer(this.pointerCanvas.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'mousedown',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            })
            .on('mouseup', () => {
                const mouseEvent = pointer(this.pointerCanvas.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'mouseup',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            });
    }

    disable() {
        if (this.moveSubscription) {
            this.subscription.remove(this.moveSubscription);
        }

        if (this.isMoveEvent) {
            this.pointerCanvas.on('mousemove', null);
        }

        this.pointerCanvas.on('mouseleave', null).on('mousedown', null).on('mouseup', null);

        this.isEnable = false;
    }

    destroy() {
        this.disable();
        this.subscription.unsubscribe();
        this.pointerCanvas.remove();
    }

    private addEvent() {
        if (!this.moveSubscription) {
            this.moveSubscription = this.move$.pipe(debounceTime(this.delayTime)).subscribe((value: [number, number]) => {
                this.chartBase.mouseEventSubject.next({
                    type: 'mousemove',
                    position: value,
                    target: this.pointerCanvas
                });
            });
        }

        this.subscription.add(this.moveSubscription);
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${chartBase.chartMargin.left + 1}px, ${chartBase.chartMargin.top + 1}px)`);
    }
}
