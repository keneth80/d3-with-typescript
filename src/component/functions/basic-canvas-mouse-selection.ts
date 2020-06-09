import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';
import { min, max } from 'd3-array';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { FunctionsBase } from '../chart/functions-base';
import { ChartBase, delayExcute, Direction, ScaleType } from '../chart';

export interface BasicCanvasMouseSelectionConfiguration {
    xField?: string;
    yField?: string;
    isZoom?: boolean;
    event?: {
        move: boolean
    };
    isMove?: boolean;
    direction?: string;
}

export class BasicCanvasMouseSelection extends FunctionsBase {
    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private xField: string = 'x';

    private yField: string = 'y';

    private isZoom: boolean = true;

    private isMouseMove: boolean = false;

    private isRestore: boolean = false;

    private xMinValue: number = NaN;

    private xMaxValue: number = NaN;

    private yMinValue: number = NaN;

    private yMaxValue: number = NaN;

    private direction: string = Direction.BOTH;

    constructor(configuration: BasicCanvasMouseSelectionConfiguration) {
        super();
        if (configuration) {
            if (configuration.hasOwnProperty('xField')) {
                this.xField = configuration.xField;
            }
    
            if (configuration.hasOwnProperty('yField')) {
                this.yField = configuration.yField;
            }

            if (configuration.hasOwnProperty('isZoom')) {
                this.isZoom = configuration.isZoom;
            }

            if (configuration.hasOwnProperty('event')) {
                this.isMouseMove = configuration.event.move;
            }

            if (configuration.hasOwnProperty('direction')) {
                this.direction = configuration.direction;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        if (!this.pointerCanvas) {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'pointer-canvas')
                .style('z-index', 99)
                .style('position', 'absolute');
        }
    }

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        this.setContainerPosition(geometry, this.chartBase);

        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        let isMouseDown = false;
        let isMouseMove = false;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        // 최초 setup why? min max를 비교해서 full scan 시에는 filtering 하지 않게 하기 위함.
        if (!this.xMinValue) {
            this.xMaxValue = xScale.min;
        }
        
        if (!this.xMaxValue) {
            this.xMaxValue = xScale.max;
        }

        if (!this.yMinValue) {
            this.yMaxValue = yScale.min;
        }

        if (!this.yMaxValue) {
            this.yMaxValue = yScale.max;
        }

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
        
        if (this.isMouseMove) {
            this.pointerCanvas.on('mousemove', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                
                const moveX = mouseEvent[0];
                const moveY = mouseEvent[1];
    
                this.chartBase.mouseEventSubject.next({
                    type: 'mousemove',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            });
        }
        
        this.pointerCanvas.call(
            drag()
            .on('start', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                startX = mouseEvent[0];
                startY = mouseEvent[1];

                this.chartBase.mouseEventSubject.next({
                    type: 'mousedown',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            })
            .on('drag', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
            
                const moveX = mouseEvent[0];
                const moveY = mouseEvent[1];

                isMouseMove = true;
                pointerContext.clearRect(0, 0, geometry.width, geometry.height);
                const start = {
                    x: 0, y: 0
                };
                const end = {
                    x: 0, y: 0
                };

                if (this.direction === Direction.HORIZONTAL) {
                    start.x = min([startX, moveX]);
                    start.y = 0;

                    end.x = max([startX, moveX]);
                    end.y = geometry.height;
                } else if (this.direction === Direction.VERTICAL) {
                    start.x = 0;
                    start.y = min([startY, moveY]);

                    end.x = geometry.width;
                    end.y = max([startY, moveY]);
                } else {
                    start.x = min([startX, moveX]);
                    start.y = min([startY, moveY]);

                    end.x = max([startX, moveX]);
                    end.y = max([startY, moveY]);
                }

                if (start.x <= 0) {
                    start.x = 1;
                }

                if (end.x > geometry.width) {
                    end.x = geometry.width - 1;
                }

                if (start.y <= 0) {
                    start.y = 1;
                }

                if (end.y > geometry.height) {
                    end.y = geometry.height - 1;
                }
                
                
                this.drawZoomBox(
                    pointerContext,
                    start,
                    end
                );

                if (this.isMouseMove) {
                    this.chartBase.mouseEventSubject.next({
                        type: 'mousemove',
                        position: mouseEvent,
                        target: this.pointerCanvas
                    });
                }
            })
            .on('end', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);

                endX = mouseEvent[0];
                endY = mouseEvent[1];

                if (endX > geometry.width) {
                    endX = geometry.width - 1;
                }

                if (endY > geometry.height) {
                    endY = geometry.height - 1;
                }

                pointerContext.clearRect(0, 0, geometry.width, geometry.height);

                if (this.isZoom && Math.abs(startX - endX) > 4 && Math.abs(startY - endY) > 4) {
                    // const xStartValue = xScale.type === ScaleType.TIME ? new Date(x.invert(startX)).getTime() : +x.invert(startX).toFixed(2);
                    // const yStartValue = xScale.type === ScaleType.TIME ? new Date(y.invert(startY)).getTime() : +y.invert(startY).toFixed(2);
                    // const xEndValue = xScale.type === ScaleType.TIME ? new Date(x.invert(endX)).getTime() : +x.invert(endX).toFixed(2);
                    // const yEndValue = xScale.type === ScaleType.TIME ? new Date(y.invert(endY)).getTime() : +y.invert(endY).toFixed(2);

                    if (startX < endX && startY < endY) {
                        this.chartBase.mouseEventSubject.next({
                            type: 'zoomin',
                            position: [endX, endY],
                            target: this.pointerCanvas,
                            zoom: {
                                direction: this.direction
                            }
                        });
                        // TODO: 버그 두번째 줌부터 마이너스가 아닌 플러스로 넘어감.
                        // delayExcute(50, () => {
                        //     this.chartBase.updateAxisForZoom([
                        //         {
                        //             field: this.xField,
                        //             min: xStartValue,
                        //             max: xEndValue
                        //         },
                        //         {
                        //             field: this.yField,
                        //             min: yEndValue,
                        //             max: yStartValue
                        //         }
                        //     ]);
                        // });
                    } else {
                        if (this.xMaxValue === xmax && this.yMaxValue === ymax) {
                            return;
                        }
                        this.chartBase.mouseEventSubject.next({
                            type: 'zoomout',
                            position: [endX, endY],
                            target: this.pointerCanvas
                        });

                        // delayExcute(50, () => {
                        //     this.chartBase.updateAxisForZoom([]);
                        // });
                    }
                } else {
                    this.chartBase.mouseEventSubject.next({
                        type: 'mouseup',
                        position: [endX, endY],
                        target: this.pointerCanvas
                    });
                }
            })
        );
    }

    destroy() {
        this.subscription.unsubscribe();
        this.pointerCanvas.remove();
    }

    private drawZoomBox(
        pointerContext: any,
        start: {x: number, y: number},
        end: {x: number, y: number}
    ) {
        pointerContext.strokeStyle = 'blue';
        pointerContext.fillStyle = 'rgba(5,222,255,0.5)';
        pointerContext.beginPath();
        pointerContext.rect(start.x, start.y, Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        pointerContext.fill();
        pointerContext.stroke();
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
    }
}