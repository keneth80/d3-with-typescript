import {max, min} from 'd3-array';
import {drag} from 'd3-drag';
import {BaseType, pointer, Selection} from 'd3-selection';

import {fromEvent, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {ChartSelector} from '../chart';
import {Direction, Placement, ScaleType} from '../chart/chart-configuration';
import {ContainerSize, Scale} from '../chart/chart.interface';
import {FunctionsBase} from '../chart/functions-base';

export interface BasicSvgMouseZoomHandlerConfiguration {
    xDirection?: string; // bottom or top
    yDirection?: string; // left or right
    isMoveEvent?: boolean;
    direction?: string;
    delayTime?: number;
}

export class BasicSvgMouseZoomHandler extends FunctionsBase {
    protected pointerGroup: Selection<any, any, HTMLElement, any>;

    protected zoomBackDrop: Selection<any, any, BaseType, any>;

    protected zoomBox: Selection<any, any, BaseType, any>;

    private xDirection: string = Placement.BOTTOM;

    private yDirection: string = Placement.LEFT;

    private isZoom: boolean = true;

    private delayTime = 30;

    private xMinValue: number = NaN;

    private xMaxValue: number = NaN;

    private yMinValue: number = NaN;

    private yMaxValue: number = NaN;

    private direction: string = Direction.BOTH;

    private isMoveEvent = true;

    private tempZoomBox: Selection<any, any, BaseType, any>;

    private moveSubscription: Subscription;

    private isDrag = false;

    constructor(configuration: BasicSvgMouseZoomHandlerConfiguration) {
        super();
        if (configuration) {
            this.xDirection = configuration.xDirection ?? this.xDirection;

            this.yDirection = configuration.yDirection ?? this.yDirection;

            this.direction = configuration.direction ?? this.direction;

            this.isMoveEvent = configuration.isMoveEvent ?? this.isMoveEvent;

            this.delayTime = configuration.delayTime ?? this.delayTime;
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;

        this.pointerGroup = this.svg.select('.' + ChartSelector.ZOOM_SVG);

        // zoom mask setup
        if (!this.svg.select('defs').select('#zoommask').node()) {
            const mask: Selection<any, any, BaseType, any> = this.svg.select('defs').append('mask').attr('id', 'zoommask').attr('x', 0).attr('y', 0);
            this.zoomBackDrop = mask.append('rect').attr('class', 'zoom-back-drop').attr('x', 0).attr('y', 0).style('fill', '#fff');
            this.zoomBox = mask.append('rect').attr('class', 'zoom-box').attr('x', 0).attr('y', 0);
        } else {
            const mask: Selection<BaseType, any, BaseType, any> = this.svg.select('defs').select('#zoommask');
            this.zoomBackDrop = mask.select('.zoom-back-drop');
            this.zoomBox = mask.select('.zoom-box');
        }

        // TODO: mask로 했더니 버벅이는 현상이 나옴. 다른 방법 강구 (예로 그냥 박스 그리기로 할 것.)
    }

    drawFunctions(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        try {
            this.disable();
            this.enable(chartData, scales, geometry);
        } catch (error) {
            console.log('error : ', error);
        }
    }

    enable(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        if (this.isEnable) {
            return;
        }

        this.isEnable = true;

        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);
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

        const start = {
            x: 0,
            y: 0
        };
        const end = {
            x: 0,
            y: 0
        };

        if (this.isMoveEvent) {
            this.moveSubscription = fromEvent(this.pointerGroup.node() as any, 'mousemove')
                .pipe(debounceTime(this.delayTime))
                .subscribe((e: any) => {
                    if (this.isDrag) {
                        return;
                    }
                    const mouseEvent: [number, number] = [
                        e.offsetX - this.chartBase.chartMargin.left - 1,
                        e.offsetY - this.chartBase.chartMargin.top - 1
                    ];
                    this.chartBase.mouseEventSubject.next({
                        type: 'mousemove',
                        position: mouseEvent,
                        target: this.pointerGroup
                    });
                });
            this.subscription.add(this.moveSubscription);
        }

        this.pointerGroup
            .call(
                drag()
                    .on('start', () => {
                        const mouseEvent = pointer(this.pointerGroup.node() as any);
                        startX = mouseEvent[0];
                        startY = mouseEvent[1];
                        this.isDrag = true;
                        this.chartBase.zoomEventSubject.next({
                            type: 'dragstart',
                            position: mouseEvent,
                            target: this.pointerGroup
                        });
                    })
                    .on('drag', (event: any) => {
                        if (event.dx === 0 || event.dy === 0) {
                            return;
                        }

                        if (!this.tempZoomBox) {
                            this.tempZoomBox = this.dragElementInit(this.mainGroup, geometry);
                            this.zoomBackDrop.attr('width', geometry.width).attr('height', geometry.height);
                        }

                        const mouseEvent = pointer(this.pointerGroup.node() as any);
                        const moveX = mouseEvent[0];
                        const moveY = mouseEvent[1];
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

                        this.drawZoomBox(this.zoomBox, start, end, geometry, startX > moveX && startY > moveY);

                        // this.chartBase.zoomEventSubject.next({
                        //     type: 'drag',
                        //     position: mouseEvent,
                        //     target: this.pointerGroup
                        // });
                    })
                    .on('end', () => {
                        this.isDrag = false;
                        const mouseEvent = pointer(this.pointerGroup.node() as any);
                        endX = mouseEvent[0];
                        endY = mouseEvent[1];

                        this.dragElementClear(this.zoomBox, this.tempZoomBox);
                        this.tempZoomBox = undefined;

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
                                    target: this.pointerGroup,
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
                            } else {
                                if (this.xMaxValue === xmax && this.yMaxValue === ymax) {
                                    this.chartBase.zoomEventSubject.next({
                                        type: 'not',
                                        position: [endX, endY],
                                        target: this.pointerGroup
                                    });
                                    return;
                                }
                                this.chartBase.zoomEventSubject.next({
                                    type: 'zoomout',
                                    position: [endX, endY],
                                    target: this.pointerGroup
                                });
                            }
                        }
                    })
            )
            .on('mouseleave', () => {
                const mouseEvent = pointer(this.pointerGroup.node() as any);
                this.isDrag = false;
                this.chartBase.mouseEventSubject.next({
                    type: 'mouseleave',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            })
            .on('mousedown', () => {
                const mouseEvent = pointer(this.pointerGroup.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'mousedown',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            })
            .on('mouseup', () => {
                console.log('mouseup');
                const mouseEvent = pointer(this.pointerGroup.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'mouseup',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            })
            .on('click', () => {
                console.log('click');
                const mouseEvent = pointer(this.pointerGroup.node() as any);

                this.chartBase.mouseEventSubject.next({
                    type: 'click',
                    position: mouseEvent,
                    target: this.pointerGroup
                });
            });
    }

    disable() {
        if (this.moveSubscription) {
            this.subscription.remove(this.moveSubscription);
        }

        if (this.isMoveEvent) {
            this.pointerGroup.on('mousemove', null);
        }

        this.pointerGroup.on('mouseleave', null).on('mousedown', null).on('mouseup', null).on('click', null);

        this.pointerGroup.call(drag().on('start', null).on('drag', null).on('end', null));

        this.isEnable = false;
    }

    destroy() {
        this.disable();
        this.subscription.unsubscribe();
        this.pointerGroup.remove();
    }

    private dragElementInit(targetGroup: Selection<BaseType, any, HTMLElement, any>, size: ContainerSize) {
        return (
            targetGroup
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', size.width)
                .attr('width', size.width)
                .attr('mask', 'url(#zoommask)')
                // .style('fill', '#ccc')
                .attr('fill-opacity', 0.3)
        );

        /**
         * <rect x='0' y='0' width='500' height='300' mask='url(#mask)' fill-opacity='0.7'/>
         */
    }

    private dragElementClear(zoomBox: Selection<BaseType, any, BaseType, any>, tempZoomBox: Selection<BaseType, any, BaseType, any>) {
        zoomBox
            // .style('fill', '#fff')
            .attr('width', 0)
            .attr('height', 0);
        if (tempZoomBox) {
            tempZoomBox.remove();
        }
    }

    private drawZoomBox(
        zoomBox: Selection<BaseType, any, BaseType, any>,
        start: {x: number; y: number},
        end: {x: number; y: number},
        size: ContainerSize,
        isRestore: boolean = false
    ) {
        zoomBox
            .attr('x', start.x)
            .attr('y', start.y)
            .attr('width', Math.abs(end.x - start.x))
            .attr('height', Math.abs(end.y - start.y));
    }

    private drawZoomBox2(
        zoomBox: Selection<BaseType, any, BaseType, any>,
        start: {x: number; y: number},
        end: {x: number; y: number},
        size: ContainerSize,
        isRestore: boolean = false
    ) {
        zoomBox
            .style('fill', '#000')
            .attr('x', start.x)
            .attr('y', start.y)
            .attr('width', Math.abs(end.x - start.x))
            .attr('height', Math.abs(end.y - start.y));
    }
}
