import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';
import { transition } from 'd3-transition';
import { easeLinear, easeCircle } from 'd3-ease';
import { quadtree, Quadtree } from 'd3-quadtree';

import { Subject, Observable } from 'rxjs';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak, isIE } from '../chart/util/d3-svg-util';

export class BasicCanvasLineSeriesModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    selected: boolean;
    obj: any;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        selected: boolean,
        obj: any
    ) {
        Object.assign(this, {
            x, y, i, selected, obj
        });
    }
}

export interface BasicCanvasLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number
    }
    style?: {
        strokeWidth?: number;
        // stroke?: string;
        // fill?: string;
    },
    filter?: any;
    animation?: boolean;
}

export class BasicCanvasLineSeries extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private dotClass: string = 'basic-canvas-line-dot';

    private xField: string;

    private yField: string;

    private config: BasicCanvasLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth: number = 2;

    private numberFmt: any;

    private isAnimation: boolean = false;

    constructor(configuration: BasicCanvasLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        if (configuration) {
            if (configuration.dotSelector) {
                this.dotClass = configuration.dotSelector;
            }

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

            if (configuration.hasOwnProperty('animation')) {
                this.isAnimation = configuration.animation;
            }
        }

        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;

        this.svg
            .style('z-index', 1)
            .style('position', 'absolute');

        // TODO: canvas 하나에 시리즈를 전부 그릴지 각각 canvas를 생성해서 그릴지 결정해야함. 현재는 각각 canvas를 생성해서 그리고 있음.
        if (!this.canvas) {            
            this.canvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'drawing-canvas')
                .style('z-index', index + 2)
                .style('position', 'absolute');
        }

        if (!select((this.svg.node() as HTMLElement).parentElement).select('.pointer-canvas').node()) {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'pointer-canvas')
                .style('z-index', index + 3)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement).select('.pointer-canvas').style('z-index', index + 3);
        }
    }

    drawSeries(lineData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const radius = this.config.dot ? (this.config.dot.radius || 4) : 0;

        const lineStroke = (this.config.style && this.config.style.strokeWidth) || 2;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        const chartData = !this.dataFilter ? lineData : lineData.filter((item: any) => this.dataFilter(item));

        this.canvas
            .attr('width', geometry.width + radius * 2 + lineStroke * 2)
            .attr('height', geometry.height + radius * 2 + lineStroke * 2)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - radius - lineStroke)}px, ${(this.chartBase.chartMargin.top - radius - lineStroke)}px)`);

        this.pointerCanvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - radius - lineStroke)}px, ${(this.chartBase.chartMargin.top - radius - lineStroke)}px)`);

        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, geometry.width, geometry.height);
            context.beginPath();

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any, i) => {
                const xposition = x(data[this.xField]) + padding + radius + lineStroke;
                return xposition; 
            }) // set the x values for the line generator
            .y((data: any) => {
                const yposition = y(data[this.yField]) + radius + lineStroke;
                return yposition; 
            })
            .context(context); // set the y values for the line generator

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        this.line(chartData);
        context.fillStyle = 'white';
        context.lineWidth = lineStroke;
        context.strokeStyle = color;
        context.stroke();

        if (this.config.dot) {
            chartData.forEach((point: any) => {
                this.drawPoint(x(point[this.xField]) + radius + lineStroke, y(point[this.yField]) + radius + lineStroke, radius, context);
            });
        }
    }

    drawPoint(cx: any, cy: any, r: number, context: any) {
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

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }
}