import {rgb} from 'd3-color';
import {quadtree} from 'd3-quadtree';
import {BaseType, select, Selection} from 'd3-selection';
import {curveMonotoneX, line} from 'd3-shape';

import {ChartSelector} from '../../chart';
import {ContainerSize, DisplayOption, DisplayType, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {colorDarker, delayExcute} from '../../chart/util/d3-svg-util';
import {setChartTooltipByPosition} from '../../chart/util/tooltip-util';

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
            x,
            y,
            i,
            data
        });
    }
}

export interface BasicCanvasTraceData {
    data: any;
    width: number;
    height: number;
    strokeColor: string;
    field: string;
    displayName: string;
}

export interface BasicCanvasTraceConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    dot?: {
        radius?: number;
        fill?: string;
    };
    line?: {
        strokeOpacity?: number;
        strokeWidth?: number;
        strokeColor?: string;
        dashArray?: number;
        isCurve?: boolean; // default : false
    };
    data?: any[];
    // animation?: boolean;
}

export class BasicCanvasTrace<T = any> extends SeriesBase {
    protected canvas: Selection<HTMLCanvasElement, any, HTMLElement, any>;

    private tooltipGroup: Selection<any, any, HTMLElement, any>;

    private line: any;

    private config: BasicCanvasTraceConfiguration;

    private restoreCanvas: Selection<any, any, HTMLElement, any>;

    private radius = 2;

    private dotFill = '';

    private strokeColor = '';

    private strokeWidth = 1;

    constructor(configuration: BasicCanvasTraceConfiguration) {
        super(configuration);
        this.config = configuration;
        this.color = this.checkSeriesColor();
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;

        if (!this.tooltipGroup) {
            this.tooltipGroup = this.setTooltipCanvas(this.svg);
            this.tooltipGroup.style('z-index', index + 2);
        } else {
            this.tooltipGroup.style('z-index', index + 2);
        }

        this.svg.style('z-index', 0).style('position', 'absolute');

        if (!this.canvas) {
            this.canvas = this.chartBase.chartContainer
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', ChartSelector.DRAWING_CANVAS)
                .style('opacity', 1)
                .style('z-index', index + 1)
                .style('position', 'absolute');
        }

        if (!this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).node()) {
            this.chartBase.chartContainer
                .append('canvas')
                .attr('class', ChartSelector.SELECTION_CANVAS)
                .style('z-index', index + 2)
                .style('position', 'absolute');
        } else {
            this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).style('z-index', index + 3);
        }
    }

    drawSeries(chartBaseData: T[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        this.geometry = geometry;
        this.strokeColor = this.checkSeriesColor() ?? option.color;
        this.dotFill = this.config?.dot?.fill ?? option.color;

        const chartData = this.config.data ? this.config.data : chartBaseData;
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        this.radius = this.config.dot ? this.config.dot.radius ?? this.radius : this.radius;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let generateData: any[];
        const lineData: any[] = !this.config.filter ? chartData : chartData.filter((item: T) => this.config.filter(item));
        // .filter((d: T) => d[this.config.xField] >= (xmin - xmin * 0.02) && d[this.config.xField] <= (xmax + xmax * 0.02) && d[this.config.yField] >= ymin && d[this.config.yField] <= ymax);

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        if (option.displayType === DisplayType.RESIZE) {
            this.restoreCanvas = undefined;
        }

        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        this.chartBase.chartContainer
            .select('.' + ChartSelector.SELECTION_CANVAS)
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
        context.fillStyle = this.dotFill;
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.beginPath();
        // context.strokeStyle = this.strokeColor;
        const rgbColor = rgb(this.strokeColor);
        context.strokeStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${this.config?.line?.strokeOpacity ?? 1})`;
        // context.lineWidth = 0.5;               // sub-pixels all points
        context.setTransform(1, 0, 0, 1, 0.5, 0.5); // not so useful for the curve itself
        if (this.config.line) {
            this.strokeWidth = this.config.line.strokeWidth ?? 1;
            context.lineWidth = this.strokeWidth;
            // context.lineWidth = 0.5;

            if (this.config.line.dashArray && this.config.line.dashArray > 0) {
                context.setLineDash([this.config.line.dashArray, this.config.line.dashArray]);
            }

            if (this.config.line.isCurve === true) {
                this.line.curve(curveMonotoneX); // apply smoothing to the line
            }
        }

        // ctx.fillStyle = "rgba(0, 0, 0, 0)";
        // ctx.fillRect(left, top, width, height);
        if (option.displayType === DisplayType.ZOOMOUT && this.restoreCanvas) {
            generateData = lineData.map((d: any, i: number) => {
                const xposition = x(d[this.config.xField]) + padding;
                const yposition = y(d[this.config.yField]);
                const obj: BasicCanvasTraceData = {
                    data: d,
                    width: this.radius,
                    height: this.radius,
                    strokeColor: this.strokeColor,
                    field: this.config.yField,
                    displayName: this.selector ?? this.displayName
                };
                return [xposition, yposition, obj];
            });
            context.drawImage(this.restoreCanvas.node(), 0, 0);
        } else {
            generateData = lineData.map((d: any, i: number) => {
                const xposition = x(d[this.config.xField]) + padding;
                const yposition = y(d[this.config.yField]);
                const obj: BasicCanvasTraceData = {
                    data: d,
                    width: this.radius,
                    height: this.radius,
                    strokeColor: this.strokeColor,
                    field: this.config.yField,
                    displayName: this.selector ?? this.displayName
                };
                // POINT: data 만들면서 포인트 찍는다.
                if (this.config.dot) {
                    context.fillRect(xposition - this.radius, yposition - this.radius, this.radius * 2, this.radius * 2);
                    // context.arc(xposition, yposition, this.config.dot.radius, 0, 2 * Math.PI, false);
                }
                return [xposition, yposition, obj];
            });

            this.line = line()
                .x((data: any) => {
                    return data[0];
                }) // set the x values for the line generator
                .y((data: any) => {
                    return data[1];
                })
                .context(context); // set the y values for the line generator
            if (this.config.line) {
                // 사이즈가 변경이 되면서 zoom out 경우에는 초기 사이즈를 업데이트 해준다.
                this.line(generateData);
                // context.fill();
                context.stroke();
            }
        }

        if (option.displayType === DisplayType.NORMAL || (option.displayType === DisplayType.ZOOMOUT && !this.restoreCanvas)) {
            this.restoreCanvas = select(document.createElement('CANVAS'));
            this.restoreCanvas.attr('width', geometry.width).attr('height', geometry.height);
            (this.restoreCanvas.node() as any).getContext('2d').drawImage(this.canvas.node(), 0, 0);
        }

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        const makeQuadtree = () => {
            this.originQuadTree = quadtree()
                .extent([
                    [0, 0],
                    [geometry.width, geometry.height]
                ])
                .addAll(generateData);
        };

        if (generateData.length >= 500000) {
            delayExcute(200, makeQuadtree);
        } else {
            makeQuadtree();
        }
    }

    drawPointer(value: number[], selected: any[]): number {
        // const index = Math.floor(selected.length / 2);
        const index = selected.length - 1;
        const selectedItem = selected[index];

        this.drawTooltipPoint(this.geometry, selectedItem, {
            radius: this.radius / 2 + 1,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth
        });

        return index;
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    destroy() {
        this.subscription.unsubscribe();
        this.canvas.remove();
        this.chartBase.chartContainer.select('.' + ChartSelector.TOOLTIP_CANVAS).remove();
        this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).remove();
    }

    getSeriesDataByPosition(value: number[]) {
        const rectSize = this.radius * 2;
        return this.canvas.style('opacity') !== '0'
            ? this.search(this.originQuadTree, value[0] - rectSize, value[1] - rectSize, value[0] + rectSize, value[1] + rectSize)
            : [];
    }

    showPointAndTooltip(value: number[], selected: any[]) {
        const index = selected.length - 1;
        const selectedItem = selected[index];
        this.drawTooltipPoint(this.geometry, selectedItem, {
            radius: this.radius / 2 + 1,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth
        });
        if (!this.chartBase.isTooltipDisplay) {
            this.tooltipGroup = this.chartBase.showTooltip();
            setChartTooltipByPosition(
                this.tooltipGroup,
                this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                    ? this.chartBase.tooltip.tooltipTextParser(selectedItem)
                    : `${this.config.xField}: ${selectedItem[2].data[this.config.xField]} \n ${this.config.yField}: ${
                          selectedItem[2].data[this.config.yField]
                      }`,
                this.geometry,
                [selectedItem[0], selectedItem[1]],
                {
                    width: this.radius,
                    height: this.radius
                },
                {
                    left: this.chartBase.chartMargin.left,
                    top: this.chartBase.chartMargin.top
                }
            );
        }

        return index;
    }

    onSelectItem(value: number[], selected: any[]) {
        const selectedItem = selected[0];
        this.drawSelectionPoint([selectedItem[0], selectedItem[1]], this.geometry, {
            fill: this.strokeColor,
            radius: this.radius * 2
        });
    }

    private checkSeriesColor() {
        return this.config.line && this.config.line.strokeColor ? this.config.line.strokeColor : undefined;
    }

    private drawTooltipPoint(geometry: ContainerSize, position: number[], style: {radius: number; strokeColor: string; strokeWidth: number}) {
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS);
        const context = (selectionCanvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.fillStyle = style.strokeColor;
        context.lineWidth = style.strokeWidth;
        context.strokeStyle = '#000000';
        // this.drawPoint(context, {cx: selectedItem[0], cy:selectedItem[1], r: style.radius});
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        const cx = position[0];
        const cy = position[1];
        if (cx < 0 || cy < 0) {
            return;
        }

        context.beginPath();
        context.fillRect(cx - style.radius * 2, cy - style.radius * 2, style.radius * 4, style.radius * 4);
        // context.strokeRect(cx - style.radius, cy - style.radius, style.radius * 2, style.radius * 2);
        // context.arc(cx, cy, style.radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }

    private drawSelectionPoint(position: number[], geometry: ContainerSize, style: {fill: string; radius: number}) {
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS);
        const context = (selectionCanvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.fillStyle = colorDarker(style.fill, 2);
        context.lineWidth = 2;
        context.strokeStyle = colorDarker(style.fill, 1);
        // this.drawPoint(context, {cx: selectedItem[0], cy:selectedItem[1], r: style.radius});
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        const cx = position[0];
        const cy = position[1];
        if (cx < 0 || cy < 0) {
            return;
        }

        context.beginPath();
        context.fillRect(cx - style.radius, cy - style.radius, style.radius * 2, style.radius * 2);
        context.closePath();
        context.fill();
        context.stroke();
    }
}
