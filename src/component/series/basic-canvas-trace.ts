import { Selection, BaseType, select, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { quadtree, Quadtree } from 'd3-quadtree';

import { fromEvent, Subject, of } from 'rxjs';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak, delayExcute } from '../chart/util/d3-svg-util';
import { debounceTime } from 'rxjs/operators';

export class BasicCanvasTraceModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    selected: boolean;
    color: string;
    memoryColor: string;
    data: any;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        color: string,
        memoryColor: string,
        selected: boolean,
        data: any
    ) {
        Object.assign(this, {
            x, y, i, selected, color, memoryColor, data
        });
    }
}

export interface BasicCanvasTraceConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    style?: {
        strokeWidth?: number;
        // stroke?: string;
        // fill?: string;
    },
    filter?: any;
    crossFilter?: {
        filerField: string;
        filterValue: string;
    };
    // animation?: boolean;
}

interface Indexing {
    [position: string]: any;
}

export class BasicCanvasTrace<T = any> extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private xField: string;

    private yField: string;

    private config: BasicCanvasTraceConfiguration;

    private dataFilter: any;

    private strokeWidth = 2;

    // private isAnimation: boolean = false;

    private parentElement: Selection<BaseType, any, HTMLElement, any>;

    private memoryCanvas: Selection<BaseType, any, HTMLElement, any>;

    private move$: Subject<any> = new Subject();

    private crossFilterDimension: any = undefined;

    // private indexing: Indexing = {};

    private originQuadTree: Quadtree<Array<any>> = undefined;

    constructor(configuration: BasicCanvasTraceConfiguration) {
        super(configuration);
        this.config = configuration;
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.filter) {
                this.dataFilter = configuration.filter;
            }

            if (configuration.style) {
                this.strokeWidth = configuration.style.strokeWidth || this.strokeWidth;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;

        this.svg
            .style('z-index', index + 2)
            .style('position', 'absolute');

        this.parentElement = select((this.svg.node() as HTMLElement).parentElement);

        if (!this.canvas) {            
            this.canvas = this.parentElement
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', 'drawing-canvas')
                .style('z-index', index + 1)
                .style('position', 'absolute');
        }

        // pointer canvas는 단 한개만 존재한다. 이벤트를 받는 canvas 임.
        if (!this.parentElement.select('.pointer-canvas').node()) {
            this.pointerCanvas = this.svg
                .append('g')
                .attr('class', 'pointer-canvas')
                .style('position', 'absolute');
            this.pointerCanvas.append('rect')
                .attr('fill', 'none')
                .style('pointer-events', 'all');
        } else {
            this.pointerCanvas = this.svg.select('.pointer-canvas');
        }
    }

    drawSeries(chartData: Array<T>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const lineStroke = (this.config.style && this.config.style.strokeWidth) || 1;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        if (this.crossFilterDimension) {
            this.crossFilterDimension.dispose();
        }

        if (this.config.crossFilter) {
            this.crossFilterDimension = this.chartBase.crossFilter(chartData).dimension((item: T) => item[this.config.crossFilter.filerField]);
        } else {
            this.crossFilterDimension = undefined;
        }

        // TODO: zoom in out 시 crossfilter 사용해서 filtering해야함.
        const lineData = this.crossFilterDimension ? this.crossFilterDimension.filter(this.config.crossFilter.filterValue).top(Infinity) : 
        !this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item));

        console.time('traceindexing');
        const generateData: Array<any> = lineData
            .map((d: BasicCanvasTraceModel, i: number) => {
                const xposition = x(d[this.xField]) + padding;
                const yposition = y(d[this.yField]);
                // this.indexing[xposition + ',' + yposition] = i;
                // data 별로 indexing 해서 loop 돌면서 덮어버리고 최종 겹치지 않는 dot에 대해서만 출력하도록 한다.
                // this.indexing[xposition + ';' + yposition] = d;
                return [xposition, yposition, d];
            });
        console.timeEnd('traceindexing');

        // const quadTreeObj: any = quadtree()
        //     .extent([[0, 0], [geometry.width, geometry.height]])
        //     .addAll(generateData);
        
        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${(this.chartBase.chartMargin.left)}px, ${(this.chartBase.chartMargin.top)}px)`);

        this.pointerCanvas.select('rect')
            .attr('width', geometry.width)
            .attr('height', geometry.height);
        
        this.pointerCanvas
            .style('transform', `translate(${(this.chartBase.chartMargin.left)}px, ${(this.chartBase.chartMargin.top)}px)`);

        this.pointerCanvas.selectAll('.mouse-line-vertical')
            .data([
                {
                    width: 1,
                    height: geometry.height
                }
            ])
            .join(
                (enter) => enter.append('path').attr('class', 'mouse-line-vertical'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('stroke', 'black')
            .style('stroke-width', '1px');

        this.pointerCanvas.selectAll('.mouse-line-horizontal')
            .data([
                {
                    width: geometry.width,
                    height: 1
                }
            ])
            .join(
                (enter) => enter.append('path').attr('class', 'mouse-line-horizontal'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('stroke', 'black')
            .style('stroke-width', '1px');

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, geometry.width, geometry.height);
            context.beginPath();

        // this.line = line()
        //     .defined(data => data[this.yField])
        //     .x((data: any) => {
        //         const xposition = x(data[this.xField]) + padding;
        //         return xposition; 
        //     }) // set the x values for the line generator
        //     .y((data: any) => {
        //         const yposition = y(data[this.yField]);
        //         return yposition; 
        //     })
        //     .context(context); // set the y values for the line generator

        this.line = line()
            .x((data: any) => {
                return data[0]; 
            }) // set the x values for the line generator
            .y((data: any) => {
                return data[1]; 
            })
            .context(context); // set the y values for the line generator

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        console.time('tracerendering');

        this.line(generateData);
        context.fillStyle = 'white';
        context.lineWidth = lineStroke;
        context.strokeStyle = color;
        context.stroke();

        console.timeEnd('tracerendering')

        if (this.chartBase.series.length - 1 === index) {
            let isOut = true;
            let isClick = false;

            this.subscription.unsubscribe();

            // TODO: chart base 의 observable 로 수정
            this.subscription = this.move$
                .pipe(
                    debounceTime(200)
                )
                .subscribe((value: any) => {
                    if (isOut) return;

                    // http://plnkr.co/edit/AowXaSYsJM8NSH6IK5B7?p=preview&preview 참고
                    const selected = this.search(this.originQuadTree, Math.round(value[0]) - 3, Math.round(value[1]) - 3, Math.round(value[0]) + 3, Math.round(value[1]) + 3);
                    
                    if (selected.length) {
                        const selectedItem = selected[selected.length - 1];
                        if (isClick) {
                            this.onClickItem(selectedItem, {
                                width: geometry.width, height: geometry.height
                            }, value);
                            isClick = false;
                        } else {
                            const selectedItem = selected[selected.length - 1];
                            this.setChartTooltip(selectedItem, {
                                width: geometry.width, height: geometry.height
                            }, value);
                        }
                    } else {
                        this.chartBase.hideTooltip();
                    }
                    
                    // TODO: event를 시리즈에서 생성하는게 아니라 plugin 식으로 따로 빼서 고민해 볼것.
                });

            // TODO: plugin의 point canvas 에서 이벤트 발생.
            this.pointerCanvas
                .on('mousemove', () => {
                    const mouseEvent = mouse(this.pointerCanvas.node() as any);

                    this.pointerCanvas.select('.mouse-line-vertical')
                        .attr('d', () => {
                            const d = 'M' + mouseEvent[0] + ',' + geometry.height + ' ' + mouseEvent[0] + ',' + 0;
                            return d;
                        });

                    this.pointerCanvas.select('.mouse-line-horizontal')
                        .attr('d', () => {
                            const d = 'M' + 0 + ',' + mouseEvent[1] + ' ' + geometry.width + ',' + mouseEvent[1];
                            return d;
                        });
                        
                    this.move$.next(mouseEvent);
                }).on('mouseleave', () => {
                    isOut = true;
                    this.pointerCanvas.style('opacity', 0);
                    this.chartBase.hideTooltip();
                }).on('mouseout', () => {
                    isOut = true;
                    this.pointerCanvas.style('opacity', 0);
                    this.chartBase.hideTooltip();
                }).on('mouseover', () => {
                    isOut = false;
                    this.pointerCanvas.style('opacity', 1);
                }).on('click', () => {
                    isClick = true;
                    const mouseEvent = mouse(this.pointerCanvas.node() as any);
                    this.move$.next(mouseEvent);
                });
        }

        if (!this.originQuadTree) {
            delayExcute(50, () => {
                this.originQuadTree = quadtree()
                    .extent([[0, 0], [geometry.width, geometry.height]])
                    .addAll(generateData);
            });
        }
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    destroy() {
        if (this.crossFilterDimension) {
            this.crossFilterDimension.dispose();
        }
        this.crossFilterDimension = undefined;
        this.subscription.unsubscribe();
        this.canvas.remove();
        this.memoryCanvas.remove();
        this.pointerCanvas.remove();
    }

    private search(quadtree: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        quadtree.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
            if (!node.length) {
                do {
                    const d = node.data;
                    const selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
                    if (selected) {
                        temp.push(d);
                    }
                } while (node = node.next);
            }
            return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
        });

        return temp;
    }

    private onClickItem(selectedItem: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        if (selectedItem) {
            this.itemClickSubject.next({
                data: selectedItem[2],
                event: {
                    offsetX: mouseEvent[0] + this.chartBase.chartMargin.left,
                    offsetY: mouseEvent[1] + this.chartBase.chartMargin.top
                },
                target: {
                    width: 1,
                    height: 1
                }
            });
        }
    }

    private setChartTooltip(d: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        this.tooltipGroup = this.chartBase.showTooltip();
    
        const textElement: any = this.tooltipGroup.select('text').attr('dy', '.1em').text(
            this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser ? 
                this.chartBase.tooltip.tooltipTextParser(d) : 
                `${this.xField}: ${d[2][this.xField]} \n ${this.yField}: ${d[2][this.yField]}`
        );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = parseTextNode.width + 7;
        const textHeight = parseTextNode.height + 5;
        
        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + 10;
        let yPosition = mouseEvent[1] + this.chartBase.chartMargin.top + 10;
        
        if (xPosition + textWidth > geometry.width) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height) {
            yPosition = yPosition - textHeight;
        }

        this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);

    }

    private drawPoint(cx: any, cy: any, r: number, context: any) {
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        if (cx < 0 || cy < 0) {
            return;
        }

        context.beginPath();
        context.arc(cx, cy, r, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }

    private getColor(i: number) {
        return (i % 256) + ',' + (Math.floor(i / 256) % 256) + ',' + (Math.floor(i / 65536) % 256);
    }
}