import { Selection, BaseType, select, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { quadtree, Quadtree } from 'd3-quadtree';

import { fromEvent, Subject, of, generate, Subscription } from 'rxjs';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak, delayExcute } from '../chart/util/d3-svg-util';
import { debounceTime } from 'rxjs/operators';
import { ChartBase, Placement } from '../chart';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

export class BasicCanvasTraceModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    data: any;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        data: any
    ) {
        Object.assign(this, {
            x, y, i, data
        });
    }
}

export interface BasicCanvasTraceConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    style?: {
        lineWidth?: number;
        strokeColor?: string;
        opacity?: number;
        // fill?: string;
    },
    dot?: {
        radius?: number;
    };
    filter?: any;
    data?: Array<any>;
    // animation?: boolean;
}

interface Indexing {
    [position: string]: any;
}

export class BasicCanvasTrace<T = any> extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private xField: string;

    private yField: string;

    private config: BasicCanvasTraceConfiguration;

    private seriesColor: string = '';

    private dataFilter: any;

    private strokeColor;

    private strokeOpacity = 1;

    // private isAnimation: boolean = false;

    private parentElement: Selection<BaseType, any, HTMLElement, any>;

    private memoryCanvas: Selection<BaseType, any, HTMLElement, any>;

    private move$: Subject<any> = new Subject();

    private originQuadTree: Quadtree<Array<any>> = undefined;

    private seriesData: Array<T>;

    // ================= zoom 관련 변수 ================ //
    private currentScales: Array<Scale>;

    private isMouseLeave: boolean = false;

    private isRestore = false;

    private isSizeUpdate = false;

    // ================= style 관련 변수 =============== //
    private radius = 4;

    private lineWidth = 1;

    private lineColor = '#000000';

    private cashingData: Array<[number, number, BasicCanvasTraceModel]>;

    private restoreCanvas: Selection<BaseType, any, HTMLElement, any>;

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
                this.lineWidth = configuration.style.lineWidth || 1;
                this.strokeColor = configuration.style.strokeColor || null;
                this.strokeOpacity = configuration.style.opacity || 1;
            }

            if (configuration.data) {
                this.seriesData = configuration.data;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;
        
        if (!this.tooltipGroup) {
            this.tooltipGroup = this.setTooltipCanvas(this.svg);
            this.tooltipGroup.style('z-index', index + 2);
        } else {
            this.tooltipGroup.style('z-index', index + 2);
        }

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
                .style('opacity', 1)
                .style('z-index', index + 1)
                .style('position', 'absolute');
        }

        if (!this.parentElement.select('.' + ChartBase.SELECTION_CANVAS).node()) {
            this.parentElement
                .append('canvas')
                .attr('class', ChartBase.SELECTION_CANVAS)
                .style('z-index', index + 2)
                .style('position', 'absolute');
        } else {
            this.parentElement.select('.' + ChartBase.SELECTION_CANVAS).style('z-index', index + 3)
        }
    }

    drawSeries(chartBaseData: Array<T>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const chartData = this.seriesData ? this.seriesData : chartBaseData;

        this.geometry = geometry;
        this.seriesColor = color;
        this.currentScales = scales;
        
        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        this.radius = this.config.dot ? this.config.dot.radius || 4 : 0;

        this.lineColor = this.strokeColor ? this.strokeColor : color;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        // 최초 setup
        if (!this.initGeometry) {
            this.initGeometry = {...geometry};

            this.scaleValue.x.min = xmin;
            this.scaleValue.x.max = xmax;
            this.scaleValue.y.min = ymin;
            this.scaleValue.y.max = ymax;

            this.isSizeUpdate = false;

            this.isRestore = false;
        } else {
            if (this.initGeometry.width === geometry.width &&
                this.initGeometry.height === geometry.height) {
                this.isSizeUpdate = false;
            } else {
                this.isSizeUpdate = true;
            }

            if (this.isSizeUpdate) {
                this.isRestore = false;
            } else {
                if ((this.scaleValue.x.min === xmin && this.scaleValue.x.max === xmax) && 
                    (this.scaleValue.y.min === ymin && this.scaleValue.y.max === ymax)) {
                    this.isRestore = true;
                } else {
                    this.isRestore = false;
                }
            }
        }

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }
        
        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${(this.chartBase.chartMargin.left)}px, ${(this.chartBase.chartMargin.top)}px)`);

        this.parentElement.select('.' + ChartBase.SELECTION_CANVAS)
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
        context.fillStyle = this.lineColor;
        context.lineWidth = this.lineWidth;
        // context.lineWidth = 0.5;
        context.strokeStyle = this.lineColor;
        context.clearRect(0, 0, geometry.width, geometry.height);

        const lineData: Array<any> = (!this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item)))
        .filter((d: T) => d[this.xField] >= (xmin - xmin * 0.02) && d[this.xField] <= (xmax + xmax * 0.02) && d[this.yField] >= ymin && d[this.yField] <= ymax);

        // const dataParse = (isDrawPoint: boolean = true) => {
        //     return lineData
        //     .map((d: BasicCanvasTraceModel, i: number) => {
        //         const xposition = x(d[this.xField]) + padding;
        //         const yposition = y(d[this.yField]);
                
        //         // POINT: data 만들면서 포인트 찍는다.
        //         if (this.config.dot && isDrawPoint) {
        //             const rectSize = this.config.dot.radius / 2;
        //             context.fillRect(xposition - rectSize, yposition - rectSize, this.config.dot.radius, this.config.dot.radius);
        //         }

        //         // this.cashingData.push([xposition, yposition, d]);

        //         return [xposition, yposition, d];
        //     });
        // }

        // const generateData: Array<any> = dataParse(!isSizeUpdate && isZoomIn);

        const generateData: Array<any> = lineData
            .map((d: BasicCanvasTraceModel, i: number) => {
                const xposition = x(d[this.xField]) + padding;
                const yposition = y(d[this.yField]);
                
                // POINT: data 만들면서 포인트 찍는다.
                if (this.config.dot && !this.isRestore) {
                    const rectSize = this.config.dot.radius / 2;
                    context.fillRect(xposition - rectSize, yposition - rectSize, this.config.dot.radius, this.config.dot.radius);
                }

                return [xposition, yposition, d];
            });

        if (!this.isSizeUpdate && this.isRestore) {
            context.drawImage(this.restoreCanvas.node(), 0, 0);
        } else {
            // 사이즈가 변경이 되면서 zoom out 경우에는 초기 사이즈를 업데이트 해준다.
            if ((this.scaleValue.x.min === xmin && this.scaleValue.x.max === xmax) && 
                (this.scaleValue.y.min === ymin && this.scaleValue.y.max === ymax)) {
                this.initGeometry.width = geometry.width;
                this.initGeometry.height = geometry.height;

                this.restoreCanvas = undefined;
            }

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

            this.line(generateData);
            
            context.save();
            context.stroke();
        }

        // if (!isSizeUpdate && !isZoomIn) {
        //     context.drawImage(this.restoreCanvas.node(), 0, 0);
        // } else {
        //     this.line = line()
        //         .x((data: any) => {
        //             return data[0]; 
        //         }) // set the x values for the line generator
        //         .y((data: any) => {
        //             return data[1]; 
        //         })
        //         .context(context); // set the y values for the line generator

        //     if (this.config.isCurve === true) {
        //         this.line.curve(curveMonotoneX); // apply smoothing to the line
        //     }

        //     this.line(generateData);
            
        //     context.save();
        //     context.stroke();
        // }

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300, () => {
            this.originQuadTree = quadtree()
                .extent([[0, 0], [geometry.width, geometry.height]])
                .addAll(generateData);

            if (!this.restoreCanvas) {
                this.restoreCanvas = select(document.createElement('CANVAS'));
                this.restoreCanvas
                    .attr('width', geometry.width)
                    .attr('height', geometry.height);
                (this.restoreCanvas.node() as any).getContext('2d').drawImage(this.canvas.node(), 0, 0);
            }
        });

        (this.canvas.node() as any).addEventListener('DOMNodeRemoved', () => {
            console.log('remove canvas');
        })
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    destroy() {
        // if (this.crossFilterDimension) {
        //     this.crossFilterDimension.dispose();
        // }
        // this.crossFilterDimension = undefined;
        this.subscription.unsubscribe();
        this.canvas.remove();
        this.memoryCanvas.remove();
    }

    getSeriesDataByPosition(value: Array<number>) {
        return this.search(
            this.originQuadTree,
            value[0] - this.config.dot.radius,
            value[1] - this.config.dot.radius,
            value[0] + this.config.dot.radius,
            value[1] + this.config.dot.radius
        );
    }

    showPointAndTooltip(value: Array<number>, selected: Array<any>) {
        if (selected.length && !this.chartBase.isTooltipDisplay) {
            // const index = Math.floor(selected.length / 2);
            const index = selected.length - 1;
            const selectedItem = selected[index];
            this.drawTooltipPoint(this.geometry, selectedItem, {
                radius: this.config.dot.radius / 2 + 1,
                strokeColor: this.lineColor,
                lineWidth: this.lineWidth
            });
            this.setChartTooltip(
                selectedItem,
                {
                    width: this.geometry.width,
                    height: this.geometry.height
                },
                value
            );
        }
    }

    onSelectItem(selectedItem: Array<any>, event: ChartMouseEvent) {
        this.onClickItem(
            selectedItem,
            {
                width: this.geometry.width,
                height: this.geometry.height
            },
            [event.position[0], event.position[1]]
        );
    }

    private search(quadtreeObj: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        if (quadtreeObj) {
            quadtreeObj.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
                if (!node.length) {
                    do {
                        const d = node.data;
                        const selected = d[0] >= x0 && d[0] < x3 && d[1] >= y0 && d[1] < y3;
                        if (selected) {
                            temp.push(d);
                        }
                    } while ((node = node.next));
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
        }

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

    private drawTooltipPoint(
        geometry: ContainerSize, 
        position: Array<number>, 
        style:{radius: number, strokeColor: string, lineWidth: number}
    ) {
        const selectionCanvas = select((this.svg.node() as HTMLElement).parentElement).select('.' + ChartBase.SELECTION_CANVAS);
        const context = (selectionCanvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.fillStyle = style.strokeColor;
        context.lineWidth = style.lineWidth;
        context.strokeStyle = '#000000';
        // this.drawPoint(context, {cx: selectedItem[0], cy:selectedItem[1], r: style.radius});
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        const cx = position[0];
        const cy = position[1];
        if (cx < 0 || cy < 0) {
            return;
        }
        
        context.beginPath();
        context.fillRect(cx - style.radius, cy - style.radius, style.radius * 2, style.radius * 2);
        // context.strokeRect(cx - style.radius, cy - style.radius, style.radius * 2, style.radius * 2);
        // context.arc(pointer.cx, pointer.cy, pointer.r, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }

    private viewClear(geometry: ContainerSize) {
        // 화면 지우기
        const context = (this.canvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
    }
}