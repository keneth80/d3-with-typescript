import { Selection, BaseType, select, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { fromEvent, Subject, of } from 'rxjs';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak } from '../chart/util/d3-svg-util';
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
    dot?: {
        radius?: number
    }
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

    private indexing: Indexing = {};

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

            // if (configuration.hasOwnProperty('animation')) {
            //     this.isAnimation = configuration.animation;
            // }
        }
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

    drawSeries(chartData: Array<T>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const radius = this.config.dot ? (this.config.dot.radius || 4) : 0;

        const lineStroke = (this.config.style && this.config.style.strokeWidth) || 1;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        const space: number = (radius + lineStroke) * 4;

        if (this.config.crossFilter) {
            this.crossFilterDimension = this.chartBase.crossFilter(chartData).dimension((item: T) => item[this.config.crossFilter.filerField]);
        } else {
            if (this.crossFilterDimension) {
                this.crossFilterDimension.dispose();
            }
            this.crossFilterDimension = undefined;
        }

        const lineData = this.crossFilterDimension ? this.crossFilterDimension.filter(this.config.crossFilter.filterValue).top(Infinity) : 
        !this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item));

        for (let i = 0; i < lineData.length; i++) {
            const position = Math.round(x(lineData[i][this.xField]) + padding + space / 4) + ';' + Math.round(y(lineData[i][this.yField]) + space / 4);
            this.indexing[position] = lineData[i];
        }

        console.log('this.indexing : ', this.indexing);

        this.canvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - space / 4)}px, ${(this.chartBase.chartMargin.top - space / 4)}px)`);

        this.pointerCanvas
            .attr('width', geometry.width + space)
            .attr('height', geometry.height + space)
            .style('transform', `translate(${(this.chartBase.chartMargin.left - space / 4)}px, ${(this.chartBase.chartMargin.top - space / 4)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, geometry.width + space, geometry.height + space);
            context.beginPath();

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any) => {
                const xposition = x(data[this.xField]) + padding + space / 4;
                return xposition; 
            }) // set the x values for the line generator
            .y((data: any) => {
                const yposition = y(data[this.yField]) + space / 4;
                return yposition; 
            })
            .context(context); // set the y values for the line generator

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        this.line(lineData);
        context.fillStyle = 'white';
        // context.fillStyle = color;
        context.lineWidth = lineStroke;
        context.strokeStyle = color;
        context.stroke();

        if (this.chartBase.series.length - 1 === index) {
            this.subscription.unsubscribe();

            this.subscription = this.move$
            .pipe(
                debounceTime(200)
            )
            .subscribe((value: any) => {
                console.log('move : ', value, this.indexing[value[0] + ';' + value[1]]);
                // TODO: pointer에 대한 데이터를 찾아서 툴팁 보여주기.
            });

            let isOut = true;

            const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
            pointerContext.lineWidth = 1;
            this.pointerCanvas.on('mousemove', () => {
                const mouseEvent = mouse(this.pointerCanvas.node() as any);

                pointerContext.clearRect(0, 0, geometry.width + space, geometry.height + space);
                pointerContext.beginPath();
                // y line
                pointerContext.moveTo(mouseEvent[0], space / 4);
                pointerContext.lineTo(mouseEvent[0], geometry.height);
                pointerContext.stroke();
                // x line
                pointerContext.moveTo(space / 4, mouseEvent[1]);
                pointerContext.lineTo(geometry.width, mouseEvent[1]);
                pointerContext.stroke();
                this.move$.next(mouseEvent);
            }).on('mouseout', () => { // on mouse out hide line, circles and text
                isOut = true;
                pointerContext.clearRect(0, 0, geometry.width + space, geometry.height + space);
            }).on('mouseover', function() { // on mouse in show line, circles and text
                isOut = false;
            });
        }

        if (this.config.dot) {
            this.memoryCanvas
                .attr('width', geometry.width + space)
                .attr('height', geometry.height + space);

            const memoryCanvasContext = (this.memoryCanvas.node() as any).getContext('2d');
            memoryCanvasContext.clearRect(0, 0, geometry.width + space, geometry.height + space);

            const prevIndex = this.pointerCanvas.data()[0] || 0;
            let colorIndex = 0;
            const colorData = {};
            lineData.forEach((point: T, i: number) => {
                const drawX = x(point[this.xField]) + padding + space / 4;
                const drawY = y(point[this.yField]) + space / 4;
                // mouse over click event를 위한 데이터 인덱싱.
                colorIndex = prevIndex + i;
                const memoryColor = this.getColor(colorIndex * 1000 + 1) + '';
                colorData[memoryColor] = new BasicCanvasTraceModel(
                    drawX, drawY, i, color, memoryColor, false, point
                );
            });

            // POINT: element 에 data 반영.
            this.canvas.data([{
                colorData,
                memoryCanvasContext: memoryCanvasContext
            }]);

            if (this.chartBase.series.length - 1 === index) {
                this.pointerCanvas.on('click', () => {
                    const mouseEvent = mouse(this.pointerCanvas.node() as any);
                    this.onClickItem({
                        width: geometry.width + space, height: geometry.height + space
                    }, radius, mouseEvent);
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
        this.subscription.unsubscribe();
        this.canvas.remove();
        this.memoryCanvas.remove();
        this.pointerCanvas.remove();
    }

    private onClickItem(geometry: ContainerSize, radius: number, mouseEvent: Array<number>) {
        const selectedItem: any = this.drawTooltipPoint(geometry, radius, mouseEvent);
        if (selectedItem) {
            this.itemClickSubject.next({
                data: selectedItem.data,
                event: {
                    offsetX: selectedItem.x + this.chartBase.chartMargin.left,
                    offsetY: selectedItem.y + this.chartBase.chartMargin.top
                },
                target: {
                    width: radius,
                    height: radius
                }
            });
        }
    }

    private drawTooltipPoint(geometry: ContainerSize, radius: number, mouseEvent: Array<number>) {
        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
        pointerContext.fillStyle = '#fff';
        pointerContext.lineWidth = this.strokeWidth;
        pointerContext.clearRect(0, 0, geometry.width, geometry.height);
        const filterTargetCanvas = this.parentElement.selectAll('.drawing-canvas').filter((d: any, i: number, node: any) => parseInt(select(node[i]).style('opacity')) === 1);
        const nodes = filterTargetCanvas.nodes().reverse();
        let selected = null;
        for (let i = 0; i < nodes.length; i++) {
            const canvasData: any = select(nodes[i]).data()[0];
            const cContext = canvasData.memoryCanvasContext;
            const colorData = canvasData.colorData;
            const cData = cContext.getImageData(mouseEvent[0], mouseEvent[1], radius * 2, radius * 2).data;
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
    
                // const parseTextNode = textElement.node().getBoundingClientRect();
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