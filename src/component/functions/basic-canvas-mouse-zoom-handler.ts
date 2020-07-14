import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom } from 'd3-zoom';
import { min, max } from 'd3-array';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { FunctionsBase } from '../chart/functions-base';
import { ChartBase, delayExcute, Direction, ScaleType, Placement } from '../chart';

export interface BasicCanvasMouseZoomHandlerConfiguration {
    xDirection?: string; // bottom or top
    yDirection?: string; // left or right
    isMove?: boolean;
    direction?: string;
}

export class BasicCanvasMouseZoomHandler extends FunctionsBase {
    protected zoomCanvas: Selection<BaseType, any, HTMLElement, any>;

    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private xDirection: string = 'bottom';

    private yDirection: string = 'left';

    private isZoom: boolean = true;

    private isMouseMove: boolean = false;

    private isRestore: boolean = false;

    private xMinValue: number = NaN;

    private xMaxValue: number = NaN;

    private yMinValue: number = NaN;

    private yMaxValue: number = NaN;

    private direction: string = Direction.BOTH;

    private isMoveEvent = true;

    constructor(configuration: BasicCanvasMouseZoomHandlerConfiguration) {
        super();
        if (configuration) {
            if (configuration.hasOwnProperty('xDirection')) {
                this.xDirection = configuration.xDirection;
            }
    
            if (configuration.hasOwnProperty('yDirection')) {
                this.yDirection = configuration.yDirection;
            }

            if (configuration.hasOwnProperty('direction')) {
                this.direction = configuration.direction;
            }

            if (configuration.hasOwnProperty('isMove')) {
                this.isMoveEvent = configuration.isMove;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;
        if (!select((this.svg.node() as HTMLElement).parentElement).select('.zoom-canvas').node()) {
            this.zoomCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'zoom-canvas')
                .style('z-index', index + 10)
                .style('position', 'absolute');
        } else {
            this.zoomCanvas = select((this.svg.node() as HTMLElement).parentElement).select('.zoom-canvas');
        }

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

        const xScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.LEFT);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

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

        const zoomContext = (this.zoomCanvas.node() as any).getContext('2d');

        const start = {
            x: 0, y: 0
        };
        const end = {
            x: 0, y: 0
        };

        if (this.isMoveEvent) {
            this.pointerCanvas.on('mousemove', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                this.chartBase.mouseEventSubject.next({
                    type: 'mousemove',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            });
        }

        this.pointerCanvas.on('click', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'click',
                position: mouseEvent,
                target: this.pointerCanvas
            });
        }).on('mouseleave', () => {
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
        
        this.pointerCanvas.call(
            drag()
            .on('start', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                startX = mouseEvent[0];
                startY = mouseEvent[1];

                this.chartBase.zoomEventSubject.next({
                    type: 'dragstart',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            })
            .on('drag', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
            
                const moveX = mouseEvent[0];
                const moveY = mouseEvent[1];

                zoomContext.clearRect(0, 0, geometry.width, geometry.height);
                
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
                    zoomContext,
                    start,
                    end
                );

                this.chartBase.zoomEventSubject.next({
                    type: 'drag',
                    position: mouseEvent,
                    target: this.pointerCanvas
                });
            })
            .on('end', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                endX = mouseEvent[0];
                endY = mouseEvent[1];
                zoomContext.clearRect(0, 0, geometry.width, geometry.height);

                let isZoomArea = true;

                if (this.direction === Direction.VERTICAL) {
                    isZoomArea = Math.abs(startY - endY) > 4;
                } else if (this.direction === Direction.HORIZONTAL) {
                    isZoomArea = Math.abs(startX - endX) > 4;
                } else {
                    isZoomArea = Math.abs(startX - endX) > 4 && Math.abs(startY - endY) > 4;
                }

                if (this.isZoom && isZoomArea) {
                    const xStartValue = xScale.type === ScaleType.TIME ? x.invert(start.x).getTime() : x.invert(start.x);
                    const yStartValue = xScale.type === ScaleType.TIME ? y.invert(start.y) : y.invert(start.y);
                    const xEndValue = xScale.type === ScaleType.TIME ? x.invert(end.x).getTime() : x.invert(end.x);
                    const yEndValue = xScale.type === ScaleType.TIME ? y.invert(end.y) : y.invert(end.y);

                    if (startX < endX && startY < endY) {
                        this.chartBase.zoomEventSubject.next({
                            type: 'zoomin',
                            position: [endX, endY],
                            target: this.pointerCanvas,
                            zoom: {
                                direction: this.direction,
                                field: {
                                    x: xScale.field,
                                    y: yScale.field
                                },
                                start: {
                                    x: xStartValue,
                                    y: yEndValue
                                },
                                end: {
                                    x: xEndValue,
                                    y: yStartValue
                                }
                            }
                        });
                        
                        // delayExcute(5, () => {
                        //     this.chartBase.updateAxisForZoom([
                        //         {
                        //             field: xScale.field,
                        //             min: xStartValue,
                        //             max: xEndValue
                        //         },
                        //         {
                        //             field: yScale.field,
                        //             min: yEndValue,
                        //             max: yStartValue
                        //         }
                        //     ]);
                        // });
                    } else {
                        console.log('zoom not ! ');
                        if (this.xMaxValue === xmax && this.yMaxValue === ymax) {
                            return;
                        }
                        
                        this.chartBase.zoomEventSubject.next({
                            type: 'zoomout',
                            position: [endX, endY],
                            target: this.pointerCanvas
                        });

                        // delayExcute(5, () => {
                        //     this.chartBase.updateAxisForZoom([]);
                        // });
                    }
                }
            })
        );
    }

    destroy() {
        this.subscription.unsubscribe();
        this.zoomCanvas.remove();
        this.pointerCanvas.remove();
    }

    private drawZoomBox(
        zoomContext: any,
        start: {x: number, y: number},
        end: {x: number, y: number}
    ) {
        zoomContext.strokeStyle = 'blue';
        zoomContext.fillStyle = 'rgba(5,222,255,0.5)';
        zoomContext.beginPath();
        zoomContext.rect(start.x, start.y, Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        zoomContext.fill();
        zoomContext.stroke();
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.zoomCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
        
        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
    }
}