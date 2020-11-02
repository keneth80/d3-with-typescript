import { Selection, BaseType, mouse, select } from 'd3-selection';
import { drag } from 'd3-drag';
import { min, max } from 'd3-array';
import { event } from 'd3';

import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { FunctionsBase } from '../chart/functions-base';
import { Direction, ScaleType, Placement } from '../chart/chart-configuration';
import { ChartSelector } from '../chart';

export interface BasicSvgMouseGuideLineHandlerConfiguration {
    xDirection?: string; // bottom or top
    yDirection?: string; // left or right
    direction?: string;
    delayTime?: number;
}

export class BasicSvgMouseGuideLineHandler extends FunctionsBase {
    protected pointerGroup: Selection<BaseType, any, HTMLElement, any>;

    private xDirection: string = Placement.BOTTOM;

    private yDirection: string = Placement.LEFT;

    private delayTime = 10;

    private direction: string = Direction.BOTH;

    constructor(configuration: BasicSvgMouseGuideLineHandlerConfiguration) {
        super();
        if (configuration) {
            this.xDirection = configuration.xDirection ?? this.xDirection;

            this.yDirection = configuration.yDirection ?? this.yDirection;

            this.direction = configuration.direction ?? this.direction;

            this.delayTime = configuration.delayTime ?? this.delayTime;
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>,
                  mainGroup: Selection<BaseType, any, HTMLElement, any>,
                  index: number) {
        this.svg = svg;
        this.mainGroup = mainGroup;

        this.pointerGroup = this.svg.select('.' + ChartSelector.ZOOM_SVG);

        if (!this.pointerGroup.select('.mouse-line').node()) {
            this.pointerGroup.append('path')
                .attr('class', 'mouse-line')
                .style('stroke', 'black')
                .style('stroke-width', '1px')
                .style('opacity', 0);
        }
    }

    drawFunctions(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        this.subscription.add(
            fromEvent(this.pointerGroup.node() as any, 'mousemove')
                .pipe(debounceTime(this.delayTime))
                .subscribe((e: MouseEvent) => {
                    const mouseEvent: [number, number] = [
                        e.offsetX - this.chartBase.chartMargin.left - 1,
                        e.offsetY - this.chartBase.chartMargin.top - 1
                    ];
                    this.chartBase.mouseEventSubject.next({
                        type: 'mousemove',
                        position: mouseEvent,
                        target: this.pointerGroup
                    });
                })
        );

        this.pointerGroup
        .on('mouseleave', () => {
            const mouseEvent = mouse(this.pointerGroup.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mouseleave',
                position: mouseEvent,
                target: this.pointerGroup
            });
        })
        .on('mousedown', () => {
            const mouseEvent = mouse(this.pointerGroup.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mousedown',
                position: mouseEvent,
                target: this.pointerGroup
            });
        })
        .on('mouseup', () => {
            console.log('mouseup');
            const mouseEvent = mouse(this.pointerGroup.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'mouseup',
                position: mouseEvent,
                target: this.pointerGroup
            });
        }).on('click', () => {
            console.log('click');
            const mouseEvent = mouse(this.pointerGroup.node() as any);

            this.chartBase.mouseEventSubject.next({
                type: 'click',
                position: mouseEvent,
                target: this.pointerGroup
            });
        });

        const targetList = this.svg.select('g.' + ChartSelector.SERIES_SVG).selectAll('path').filter((d: any, index: number, nodeList: any) => {
            return select(nodeList[index]).style('fill') === 'none';
        });

        const targetGroup = this.svg.select('g.' + ChartSelector.SERIES_SVG)
                .selectAll('.mouse-per-line')
                .data(targetList.nodes().map((d: any, i: number) => i))
                .join(
                    (enter) => enter.append('g').attr('class', 'mouse-per-line'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('opacity', 0);
        targetGroup.append('circle')
            .attr('r', 7)
            .style('fill', 'none')
            .style('stroke-width', '2px')
            .style('stroke', (data: number) => this.chartBase.getColorByIndex(data));
        targetGroup.append('text')
            .attr('transform', 'translate(10,3)');

        this.pointerGroup
        .on('mousemove', () => {
            const mouseEvent = mouse(this.pointerGroup.node() as any);
            this.pointerGroup.select('.mouse-line')
                .attr('d', () => {
                    let d = 'M' + mouseEvent[0] + ',' + geometry.height;
                    d += ' ' + mouseEvent[0] + ',' + 0;
                    return d;
                });

            this.svg.select('g.' + ChartSelector.SERIES_SVG).selectAll('.mouse-per-line')
                .attr('transform', (d: any, index: number, nodeList: any) => {
                    const currentTarget = (targetList.nodes()[index] as any);
                    let beginning = 0;
                    let endIndex = currentTarget.getTotalLength();
                    let target = null;
                    let pos: any = null;
                    while (true){
                        target = Math.floor((beginning + endIndex) / 2);
                        pos = currentTarget.getPointAtLength(target);
                        if ((target === endIndex || target === beginning) && pos.x !== mouseEvent[0]) {
                            break;
                        }
                        if (pos.x > mouseEvent[0]) endIndex = target;
                        else if (pos.x < mouseEvent[0]) beginning = target;
                        else break;
                    }

                    select(nodeList[index]).select('text')
                    .text(y.invert(pos.y).toFixed(2));

                    return 'translate(' + mouseEvent[0] + ',' + pos.y +')';
                });
        })
        .on('mouseover', () => {
            this.pointerGroup.select('.mouse-line').style('opacity', 1);
            this.svg.select('g.' + ChartSelector.SERIES_SVG).selectAll('.mouse-per-line').style('opacity', 1);
        })
        .on('mouseout', () => {
            this.pointerGroup.select('.mouse-line').style('opacity', 0);
            this.svg.select('g.' + ChartSelector.SERIES_SVG).selectAll('.mouse-per-line').style('opacity', 0);
        });
    }

    destroy() {
        this.svg.select('g.' + ChartSelector.SERIES_SVG).selectAll('g.mouse-per-line').remove();
        this.subscription.unsubscribe();
    }

    private dragElementInit(
        targetGroup: Selection<BaseType, any, HTMLElement, any>,
        size: ContainerSize
    ) {
        return targetGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', size.width)
            .attr('width', size.width)
            .attr('mask', 'url(#zoommask)')
            // .style('fill', '#ccc')
            .attr('fill-opacity', 0.3)

        /**
         * <rect x='0' y='0' width='500' height='300' mask='url(#mask)' fill-opacity='0.7'/>
         */
    }

    private dragElementClear(
        zoomBox: Selection<BaseType, any, BaseType, any>,
        tempZoomBox: Selection<BaseType, any, BaseType, any>
    ) {
        zoomBox
            .attr('width', 0)
            .attr('height', 0);
        if (tempZoomBox) {
            tempZoomBox.remove();
        }
    }

    private drawZoomBox(
        zoomBox: Selection<BaseType, any, BaseType, any>,
        start: {x: number, y: number},
        end: {x: number, y: number},
        size: ContainerSize,
        isRestore: boolean = false
    ) {
        zoomBox
            .attr('x', start.x)
            .attr('y', start.y)
            .attr('width', Math.abs(end.x - start.x))
            .attr('height', Math.abs(end.y - start.y));
    }
}