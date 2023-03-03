import {hsl} from 'd3-color';
import {BaseType, pointer, select, Selection} from 'd3-selection';
import {curveMonotoneX, line} from 'd3-shape';
import {Subject} from 'rxjs';

import {debounceTime} from 'rxjs/operators';
import {ChartSelector} from '../../chart';
import {ContainerSize, DisplayOption, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {textBreak} from '../../chart/util/d3-svg-util';

export class BasicCanvasLineSeriesModel {
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
            x,
            y,
            i,
            selected,
            color,
            memoryColor,
            data
        });
    }
}

export interface BasicCanvasLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number;
    };
    style?: {
        strokeWidth?: number;
        // stroke?: string;
        // fill?: string;
    };
    filter?: any;
    crossFilter?: {
        filerField: string;
        filterValue: string;
    };
    // animation?: boolean;
}

export class BasicCanvasLineSeries<T = any> extends SeriesBase {
    protected canvas: Selection<HTMLCanvasElement, any, HTMLElement, any>;

    protected pointerCanvas: Selection<any, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private config: BasicCanvasLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth = 2;

    // private isAnimation: boolean = false;

    private memoryCanvas: Selection<HTMLCanvasElement, any, HTMLElement, any>;

    private move$: Subject<any> = new Subject();

    private crossFilterDimension: any = undefined;

    constructor(configuration: BasicCanvasLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        this.dataFilter = configuration.filter;
        this.strokeWidth = configuration.style.strokeWidth ?? this.strokeWidth;
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;

        this.svg.style('z-index', 1).style('position', 'absolute');

        if (!this.canvas) {
            this.canvas = this.chartBase.chartContainer
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', 'drawing-canvas')
                .style('z-index', index + 3)
                .style('position', 'absolute');
        }

        if (!this.memoryCanvas) {
            this.memoryCanvas = select(document.createElement('canvas'));
        }

        // pointer canvas는 단 한개만 존재한다. 이벤트를 받는 canvas 임.
        if (!this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS).node()) {
            this.pointerCanvas = this.chartBase.chartContainer
                .append('canvas')
                .attr('class', ChartSelector.POINTER_CANVAS)
                .style('z-index', index + 4)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS).style('z-index', index + 4);
        }
    }

    drawSeries(chartData: T[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const radius = this.config.dot ? this.config.dot.radius ?? 4 : 0;

        const lineStroke = (this.config.style && this.config.style.strokeWidth) ?? 1;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        const space: number = (radius + lineStroke) * 4;

        const lineData = !this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item));

        this.canvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${this.chartBase.chartMargin.left - space / 4}px, ${this.chartBase.chartMargin.top - space / 4}px)`);

        this.pointerCanvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${this.chartBase.chartMargin.left - space / 4}px, ${this.chartBase.chartMargin.top - space / 4}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width + space, geometry.height + space);
        context.beginPath();

        this.line = line()
            .defined((data: any) => data[this.config.yField])
            .x((data: any) => {
                const xposition = x(data[this.config.xField]) + padding + space / 4;
                return xposition;
            }) // set the x values for the line generator
            .y((data: any) => {
                const yposition = y(data[this.config.yField]) + space / 4;
                return yposition;
            })
            .context(context); // set the y values for the line generator

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }
        this.color = option.color;
        const strokeStyle = hsl(option.color);

        this.line(lineData);
        context.fillStyle = 'white';
        context.lineWidth = lineStroke;
        context.strokeStyle = strokeStyle;
        context.stroke();

        if (this.config.dot) {
            this.memoryCanvas.attr('width', geometry.width + space).attr('height', geometry.height + space);

            const memoryCanvasContext = (this.memoryCanvas.node() as any).getContext('2d');
            memoryCanvasContext.clearRect(0, 0, geometry.width + space, geometry.height + space);

            const prevIndex = this.pointerCanvas.data()[0] ?? 0;
            let colorIndex = 0;
            const colorData: any = {};
            lineData.forEach((point: any, i: number) => {
                const drawX = x(point[this.config.xField]) + padding + space / 4;
                const drawY = y(point[this.config.yField]) + space / 4;
                this.drawPoint(drawX, drawY, radius, context);

                // mouse over click event를 위한 데이터 인덱싱.
                colorIndex = prevIndex + i;
                const memoryColor = this.getColor(colorIndex * 1000 + 1) + '';

                // Space out the colors a bit
                memoryCanvasContext.fillStyle = 'rgb(' + memoryColor + ')';
                memoryCanvasContext.beginPath();
                memoryCanvasContext.arc(drawX, drawY, radius, 0, 2 * Math.PI);
                memoryCanvasContext.fill();

                colorData[memoryColor] = new BasicCanvasLineSeriesModel(drawX, drawY, i, option.color, memoryColor, false, point);
            });

            // POINT: element 에 data 반영.
            this.canvas.data([
                {
                    colorData,
                    memoryCanvasContext
                }
            ]);

            // 머지한 데이터를 canvas에 저장한다.
            // this.pointerCanvas.data([colorIndex]);

            if (this.chartBase.series.length - 1 === option.index) {
                this.subscription.unsubscribe();

                this.subscription = this.move$.pipe(debounceTime(150)).subscribe((value: any) => {
                    this.drawTooltipPoint(
                        {
                            width: geometry.width + space,
                            height: geometry.height + space
                        },
                        radius,
                        value
                    );
                });

                this.pointerCanvas.on('mousemove', () => {
                    const mouseEvent = pointer(this.pointerCanvas.node() as any);
                    this.move$.next(mouseEvent);
                });

                this.pointerCanvas.on('click', () => {
                    const mouseEvent = pointer(this.pointerCanvas.node() as any);
                    this.onClickItem(
                        {
                            width: geometry.width + space,
                            height: geometry.height + space
                        },
                        radius,
                        mouseEvent
                    );
                });
            }
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

    private onClickItem(geometry: ContainerSize, radius: number, mouseEvent: number[]) {
        const selectedItem: any = this.drawTooltipPoint(geometry, radius, mouseEvent);
        if (selectedItem) {
        }
    }

    private drawTooltipPoint(geometry: ContainerSize, radius: number, mouseEvent: number[]) {
        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
        pointerContext.fillStyle = '#fff';
        pointerContext.lineWidth = this.strokeWidth;
        pointerContext.clearRect(0, 0, geometry.width, geometry.height);
        pointerContext.beginPath();
        const filterTargetCanvas = this.chartBase.chartContainer
            .selectAll('.drawing-canvas')
            .filter((d: any, i: number, node: any) => parseInt(select(node[i]).style('opacity'), 16) === 1);
        const nodes = filterTargetCanvas.nodes().reverse();
        let selected = null;
        for (let i = 0; i < nodes.length; i++) {
            const canvasData: any = select(nodes[i]).data()[0];
            const cContext = canvasData.memoryCanvasContext;
            const colorData = canvasData.colorData;
            const cData = cContext.getImageData(mouseEvent[0], mouseEvent[1], radius * 2, radius * 2).data;
            const cDataParse = cData.slice(0, 3);
            const ckey = cDataParse.toString();
            selected = colorData[ckey];
            if (selected) {
                pointerContext.strokeStyle = selected.color;
                this.drawPoint(selected.x, selected.y, radius * 2, pointerContext);
                this.tooltipGroup = this.chartBase.showTooltip();
                const textElement: any = this.tooltipGroup
                    .select('text')
                    .attr('dy', '0em')
                    .text(this.chartBase.tooltip.tooltipTextParser(selected.data));
                textBreak(textElement, '\n');
                const parseTextNode = textElement.node().getBBox();
                const textWidth = parseTextNode.width + 5;
                const textHeight = parseTextNode.height + 5;

                const padding = radius * 2;
                let xPosition = selected.x + padding + this.chartBase.chartMargin.left;
                let yPosition = selected.y + padding + this.chartBase.chartMargin.top;
                if (xPosition + textWidth > geometry.width) {
                    xPosition = xPosition - textWidth;
                }
                if (yPosition + textHeight > geometry.height) {
                    yPosition = yPosition - textHeight - radius * 2;
                }

                this.tooltipGroup
                    .attr('transform', `translate(${xPosition}, ${yPosition})`)
                    .selectAll('rect')
                    .attr('width', textWidth)
                    .attr('height', textHeight);

                break;
            }
        }

        if (!selected) {
            this.tooltipGroup = this.chartBase.hideTooltip();
        }

        return selected;
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
