import { Selection, BaseType, select, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak } from '../chart/util/d3-svg-util';

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
            x, y, i, selected, color, memoryColor, data
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
    // animation?: boolean;
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

    private parentElement: Selection<BaseType, any, HTMLElement, any>;

    private memoryCanvas: Selection<BaseType, any, HTMLElement, any>;

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

            // if (configuration.hasOwnProperty('animation')) {
            //     this.isAnimation = configuration.animation;
            // }
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

        this.parentElement = select((this.svg.node() as HTMLElement).parentElement);

        if (!this.canvas) {            
            this.canvas = this.parentElement
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
        if (!this.parentElement.select('.pointer-canvas').node()) {
            this.pointerCanvas = this.parentElement
                .append('canvas')
                .attr('class', 'pointer-canvas')
                .style('z-index', index + 4)
                .style('position', 'absolute');
        } else {
            this.pointerCanvas = this.parentElement.select('.pointer-canvas').style('z-index', index + 4);
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

        const space: number = (radius + lineStroke) * 2;

        const chartData = !this.dataFilter ? lineData : lineData.filter((item: any) => this.dataFilter(item));

        this.canvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - space / 2)}px, ${(this.chartBase.chartMargin.top - space / 2)}px)`);

        this.pointerCanvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - space / 2)}px, ${(this.chartBase.chartMargin.top - space / 2)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, geometry.width + space, geometry.height + space);
            context.beginPath();

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any, i) => {
                const xposition = x(data[this.xField]) + padding + space / 2;
                return xposition; 
            }) // set the x values for the line generator
            .y((data: any) => {
                const yposition = y(data[this.yField]) + space / 2;
                return yposition; 
            })
            .context(context); // set the y values for the line generator

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        this.line(chartData);
        context.fillStyle = 'white';
        // context.fillStyle = color;
        context.lineWidth = lineStroke;
        context.strokeStyle = color;
        context.stroke();

        if (this.config.dot) {
            this.memoryCanvas
                .attr('width', geometry.width + space)
                .attr('height', geometry.height + space);

            const memoryCanvasContext = (this.memoryCanvas.node() as any).getContext('2d');
            memoryCanvasContext.clearRect(0, 0, geometry.width + space, geometry.height + space);

            const prevIndex = this.pointerCanvas.data()[0] || 0;
            let colorIndex = 0;
            const colorData = {};
            chartData.forEach((point: any, i: number) => {
                const drawX = x(point[this.xField]) + space / 2;
                const drawY = y(point[this.yField]) + space / 2;
                this.drawPoint(drawX, drawY, radius, context);

                // mouse over click event를 위한 데이터 인덱싱.
                colorIndex = prevIndex + i;
                const memoryColor = this.getColor(colorIndex * 1000 + 1) + '';

                // Space out the colors a bit
                memoryCanvasContext.fillStyle = 'rgb(' + memoryColor + ')';
                memoryCanvasContext.beginPath();
                memoryCanvasContext.arc(drawX, drawY, radius, 0, 2 * Math.PI);
                memoryCanvasContext.fill();

                colorData[memoryColor] = new BasicCanvasLineSeriesModel(
                    drawX, drawY, i, color, memoryColor, false, point
                );
            });

            this.canvas.data([{
                colorData,
                memoryCanvasContext: memoryCanvasContext
            }]);

            // 머지한 데이터를 canvas에 저장한다.
            this.pointerCanvas.data([colorIndex]);

            if (this.chartBase.series.length - 1 === index) {
                this.pointerCanvas.on('mousemove', () => {
                    this.drawTooltipPoint({
                        width: geometry.width + space, height: geometry.height + space
                    }, radius);
                });

                this.pointerCanvas.on('click', () => {
                    this.onClickItem({
                        width: geometry.width + space, height: geometry.height + space
                    }, radius);
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

    private onClickItem(geometry: ContainerSize, radius: number) {
        const selectedItem: any = this.drawTooltipPoint(geometry, radius);
        if (selectedItem) {
            this.itemClickSubject.next({
                data: selectedItem.data,
                event: {
                    offsetX: selectedItem.x + this.chartBase.chartMargin.left,
                    offsetY: selectedItem.y + this.chartBase.chartMargin.top
                }
            });
        }
    }

    private drawTooltipPoint(geometry: ContainerSize, radius: number) {
        const mouseEvent = mouse(this.pointerCanvas.node() as any);
        const moveX = mouseEvent[0];
        const moveY = mouseEvent[1];
        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
        pointerContext.fillStyle = '#fff';
        pointerContext.lineWidth = this.strokeWidth;
        pointerContext.clearRect(0, 0, geometry.width, geometry.height);
        const filterTargetCanvas = this.parentElement.selectAll('.drawing-canvas').filter((d: any, i: number, node: any) => parseInt(select(node[i]).style('opacity')) === 1);
        const nodes = filterTargetCanvas.nodes().reverse();
        let selected = null;
        for (let i: number = 0; i < nodes.length; i++) {
            const canvasData: any = select(nodes[i]).data()[0];
            const cContext = canvasData.memoryCanvasContext;
            const colorData = canvasData.colorData;
            const cData = cContext.getImageData(moveX, moveY, 1, 1).data;
            const cDataParse = cData.slice(0,3);
            const ckey = cDataParse.toString();
            selected = colorData[ckey];
            if (selected) {
                pointerContext.strokeStyle = selected.color;
                this.drawPoint(selected.x, selected.y, radius * 2, pointerContext);
    
                this.tooltipGroup = this.chartBase.showTooltip();
    
                const textElement: any = this.tooltipGroup.select('text').attr('dy', '0em').text(
                    this.chartBase.tooltip.tooltipTextParser(selected.data)
                );
    
                textBreak(textElement, '\n');
    
                const parseTextNode = textElement.node().getBoundingClientRect();
    
                const textWidth = parseTextNode.width + 5;
                const textHeight = parseTextNode.height + 5;
                
                const padding = radius * 2;
                let xPosition = selected.x + padding + this.chartBase.chartMargin.left;
                
                let yPosition = selected.y + padding + this.chartBase.chartMargin.top;
                
                if (xPosition + textWidth > geometry.width) {
                    xPosition = xPosition - textWidth;
                }
    
                this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
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