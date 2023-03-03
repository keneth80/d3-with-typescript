import {Selection, BaseType, pointer} from 'd3-selection';

import {Scale, ContainerSize} from '../chart/chart.interface';
import {FunctionsBase} from '../chart/functions-base';
import {ChartBase, ChartSelector} from '../chart';
import {fromEvent} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export interface BasicSvgMouseHandlerConfiguration {
    isMoveEvent?: boolean;
    delayTime?: number;
}

export class BasicSvgMouseHandler extends FunctionsBase {
    protected pointerGroup: Selection<BaseType, any, HTMLElement, any>;

    private isMoveEvent = false;

    private delayTime = 30;

    constructor(configuration: BasicSvgMouseHandlerConfiguration) {
        super();
        if (configuration) {
            this.isMoveEvent = configuration.isMoveEvent ?? this.isMoveEvent;

            this.delayTime = configuration.delayTime ?? this.delayTime;
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        this.pointerGroup = this.svg.select('.' + ChartSelector.ZOOM_SVG);
    }

    drawFunctions(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        this.setContainerPosition(geometry, this.chartBase);
        if (this.isMoveEvent) {
            this.subscription.add(
                fromEvent(this.pointerGroup.node() as any, 'mousemove')
                    .pipe(debounceTime(this.delayTime))
                    .subscribe((e: any) => {
                        const x = e.offsetX - this.chartBase.chartMargin.left - 1;
                        const y = e.offsetY - this.chartBase.chartMargin.top - 1;
                        const mouseEvent: [number, number] = [x, y];
                        this.chartBase.mouseEventSubject.next({
                            type: 'mousemove',
                            position: mouseEvent,
                            target: this.pointerGroup
                        });
                    })
            );

            this.subscription.add(
                fromEvent(this.pointerGroup.node() as any, 'mouseleave')
                    .pipe(debounceTime(this.delayTime + 10))
                    .subscribe((e: any) => {
                        const x = e.offsetX - this.chartBase.chartMargin.left - 1;
                        const y = e.offsetY - this.chartBase.chartMargin.top - 1;
                        const mouseEvent: [number, number] = [x, y];
                        this.chartBase.mouseEventSubject.next({
                            type: 'mouseleave',
                            position: mouseEvent,
                            target: this.pointerGroup
                        });
                    })
            );
        }

        this.pointerGroup
            .on('mousedown', () => {
                const mouseEvent = pointer(this.pointerGroup.node() as any);
                this.chartBase.mouseEventSubject.next({
                    type: 'mousedown',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            })
            .on('mouseup', () => {
                // const mouseEvent = mouse(this.pointerGroup.node() as any);
                // this.chartBase.mouseEventSubject.next({
                //     type: 'mouseup',
                //     position: mouseEvent,
                //     target: this.pointerGroup
                // });
            })
            .on('click', () => {
                const mouseEvent = pointer(this.pointerGroup.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'click',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            });
    }

    destroy() {
        this.subscription.unsubscribe();
        this.pointerGroup.remove();
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.pointerGroup
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${chartBase.chartMargin.left + 1}px, ${chartBase.chartMargin.top + 1}px)`);
    }
}
