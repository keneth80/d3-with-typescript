import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';
import { min, max } from 'd3-array';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { FunctionsBase } from '../chart/functions-base';
import { ChartBase } from '../chart/chart-base';
import { Direction, ScaleType, Placement } from '../chart/chart-configuration';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface BasicCanvasMouseHandlerConfiguration {
    isMoveEvent?: boolean;
}

export class BasicCanvasMouseHandler extends FunctionsBase {
    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private isMoveEvent = false;

    constructor(configuration: BasicCanvasMouseHandlerConfiguration) {
        super();
        if (configuration) {
            if (configuration.hasOwnProperty('isMoveEvent')) {
                this.isMoveEvent = configuration.isMoveEvent;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        if (!select((this.svg.node() as HTMLElement).parentElement).select('.' + ChartBase.POINTER_CANVAS).node()) {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', ChartBase.POINTER_CANVAS)
                .style('z-index', index + 20)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement).select('.' + ChartBase.POINTER_CANVAS);
        }
    }

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        this.setContainerPosition(geometry, this.chartBase);
        
        if (this.isMoveEvent) {
            // this.pointerCanvas.on('mousemove', () => {
            //     const mouseEvent = mouse(this.pointerCanvas.node() as any);
            //     this.chartBase.mouseEventSubject.next({
            //         type: 'mousemove',
            //         position: mouseEvent,
            //         target: this.pointerCanvas
            //     });
            // });

            this.subscription.add(
                fromEvent(this.pointerCanvas.node() as any, 'mousemove')
                    .pipe(debounceTime(100))
                    .subscribe((e: MouseEvent) => {
                        const x = e.offsetX - this.chartBase.chartMargin.left - 1;
                        const y = e.offsetY - this.chartBase.chartMargin.top - 1;
                        const mouseEvent: [number, number] = [x, y];
                        this.chartBase.mouseEventSubject.next({
                            type: 'mousemove',
                            position: mouseEvent,
                            target: this.pointerCanvas
                        });
                    })
            );
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

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
    }
}