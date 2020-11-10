import { Selection, BaseType, select } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { quadtree } from 'd3-quadtree';

import { Scale, ContainerSize, DisplayOption, DisplayType } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { textBreak, delayExcute, colorDarker } from '../../chart/util/d3-svg-util';
import { Placement } from '../../chart/chart-configuration';
import { ChartSelector } from '../../chart';

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
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    style?: {
        lineWidth?: number;
        strokeColor?: string;
        opacity?: number;
    },
    dot?: {
        radius?: number;
    };
    filter?: any;
    data?: any[];
    // animation?: boolean;
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

    private seriesData: T[];

    // ================= style 관련 변수 =============== //
    private radius = 4;

    private lineWidth = 1;

    private lineColor = '#000000';

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
            .style('z-index', 0)
            .style('position', 'absolute');

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
            this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).style('z-index', index + 3)
        }
    }

    drawSeries(chartBaseData: T[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        this.geometry = geometry;
        this.seriesColor = option.color;

        const chartData = this.seriesData ? this.seriesData : chartBaseData;
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        this.radius = this.config.dot ? this.config.dot.radius || 4 : 0;

        this.lineColor = this.strokeColor ? this.strokeColor : option.color;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

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
            .style('transform', `translate(${(this.chartBase.chartMargin.left)}px, ${(this.chartBase.chartMargin.top)}px)`);

        this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS)
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
        context.fillStyle = this.lineColor;
        context.lineWidth = this.lineWidth;
        // context.lineWidth = 0.5;
        context.strokeStyle = this.lineColor;
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.beginPath();

        // ctx.fillStyle = "rgba(0, 0, 0, 0)";
        // ctx.fillRect(left, top, width, height);

        let generateData: any[];
        delayExcute(100, () => {
            const lineData: any[] = (!this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item)))
            .filter((d: T) => d[this.xField] >= (xmin - xmin * 0.02) && d[this.xField] <= (xmax + xmax * 0.02) && d[this.yField] >= ymin && d[this.yField] <= ymax);

            if (option.displayType === DisplayType.ZOOMOUT && this.restoreCanvas) {
                generateData = lineData
                    .map((d: BasicCanvasTraceModel, i: number) => {
                        const xposition = x(d[this.xField]) + padding;
                        const yposition = y(d[this.yField]);
                        return [xposition, yposition, d];
                    });
                context.drawImage(this.restoreCanvas.node(), 0, 0);
            } else {
                generateData = lineData
                    .map((d: BasicCanvasTraceModel, i: number) => {
                        const xposition = x(d[this.xField]) + padding;
                        const yposition = y(d[this.yField]);
                        // POINT: data 만들면서 포인트 찍는다.
                        // if (this.config.dot) {
                        const rectSize = this.config.dot.radius;
                        context.fillRect(xposition - rectSize, yposition - rectSize, rectSize * 2, rectSize * 2);
                        // context.arc(xposition, yposition, this.config.dot.radius, 0, 2 * Math.PI, false);
                        // }

                        return [xposition, yposition, d, this.radius];
                    });
                // 사이즈가 변경이 되면서 zoom out 경우에는 초기 사이즈를 업데이트 해준다.
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
                // context.fill();
                context.stroke();
            }

            if (this.originQuadTree) {
                this.originQuadTree = undefined;
            }
        });

        delayExcute(300, () => {
            if ((option.displayType === DisplayType.NORMAL ||
                 option.displayType === DisplayType.ZOOMOUT && !this.restoreCanvas)) {
                this.restoreCanvas = select(document.createElement('CANVAS'));
                this.restoreCanvas
                    .attr('width', geometry.width)
                    .attr('height', geometry.height);
                (this.restoreCanvas.node() as any).getContext('2d').drawImage(this.canvas.node(), 0, 0);
            }

            this.originQuadTree = quadtree()
                .extent([[0, 0], [geometry.width, geometry.height]])
                .addAll(generateData);
        });
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
        const rectSize = this.config.dot.radius * 2;
        return this.search(
            this.originQuadTree,
            value[0] - rectSize,
            value[1] - rectSize,
            value[0] + rectSize,
            value[1] + rectSize
        );
    }

    showPointAndTooltip(value: number[], selected: any[]) {
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

        return index;
    }

    onSelectItem(value: number[], selected: any[]) {
        const selectedItem = selected[0];
        this.drawSelectionPoint(
            [
                selectedItem[0],
                selectedItem[1]
            ],
            this.geometry,
            {
                fill: this.lineColor,
                radius: this.radius * 2
            }
        );
    }

    private setChartTooltip(d: any, geometry: ContainerSize, mouseEvent: number[]) {
        this.tooltipGroup = this.chartBase.showTooltip();

        const textElement: any = this.tooltipGroup.select('text').attr('dy', '.1em').text(
            this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser ?
                this.chartBase.tooltip.tooltipTextParser(d[2]) :
                `${this.xField}: ${d[2][this.xField]} \n ${this.yField}: ${d[2][this.yField]}`
        );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = Math.floor(parseTextNode.width) + 7;
        const textHeight = Math.floor(parseTextNode.height) + 5;

        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + this.radius * 2;
        let yPosition = mouseEvent[1] + this.chartBase.chartMargin.top + this.radius * 2;

        if (xPosition + textWidth > geometry.width + this.chartBase.chartMargin.left) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height + this.chartBase.chartMargin.top) {
            yPosition = yPosition - textHeight;
        }

        this.tooltipGroup.attr('transform', `translate(${xPosition + this.radius}, ${yPosition + this.radius})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);

    }

    private drawTooltipPoint(
        geometry: ContainerSize,
        position: number[],
        style:{radius: number, strokeColor: string, lineWidth: number}
    ) {
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS);
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
        context.fillRect(cx - style.radius * 2, cy - style.radius * 2, style.radius * 4, style.radius * 4);
        // context.strokeRect(cx - style.radius, cy - style.radius, style.radius * 2, style.radius * 2);
        // context.arc(cx, cy, style.radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }

    private drawSelectionPoint(
        position: number[],
        geometry: ContainerSize,
        style:{fill: string, radius: number}
    ) {
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