import { Selection, BaseType, select, mouse } from 'd3-selection';
import { quadtree, Quadtree } from 'd3-quadtree';
import { min, max } from 'd3-array';
import { interval, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export class BasicCanvasScatterPlotModel {
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

export interface BasicCanvasScatterPlotConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class BasicCanvasScatterPlot extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    private indexing: any = {};

    private xField: string = 'x';

    private yField: string = 'y';

    private prevCanvas: any = null;

    private isRestore: boolean = false;

    private isZoom: boolean = false;

    constructor(configuration: BasicCanvasScatterPlotConfiguration) {
        super();
        if (configuration.selector) {
            this.selector = configuration.selector;
        }

        if (configuration.xField) {
            this.xField = configuration.xField;
        }

        if (configuration.yField) {
            this.yField = configuration.yField;
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        select((this.svg.node() as HTMLElement).parentElement)
            .select('svg')
            .style('z-index', 1)
            .style('position', 'absolute');
        if (!this.canvas) {            
            this.canvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'drawing-canvas')
                .style('z-index', 2)
                .style('position', 'absolute');
        }

        if (!this.pointerCanvas) {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .attr('class', 'pointer-canvas')
                .style('z-index', 3)
                .style('position', 'absolute');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const xScale: Scale = scales.find((scale: Scale) => scale.orinet === 'bottom');
        const yScale: Scale = scales.find((scale: Scale) => scale.orinet === 'left');
        const x: any = xScale.scale;
        const y: any = yScale.scale;
        
        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        const pointRadius = 4;

        const generateData: Array<any> = chartData
            .filter((d: BasicCanvasScatterPlotModel) => d.x >= xmin && d.x <= xmax && d.y >= ymin && d.y <= ymax)
            .map((d: BasicCanvasScatterPlotModel, i: number) => {
                // TODO: position별로 indexing 해서 loop 돌면서 덮어버리고 최종 겹치지 않는 dot에 대해서만 출력하도록 한다.
                this.indexing[d.x + ',' + d.y] = i;
                return [d.x, d.y];
            });

        const quadTreeObj: any = quadtree()
            .extent([[-1, -1], [width + 1, height + 1]])
            .addAll(generateData);

        this.canvas
            .attr('width', width - 1)
            .attr('height', height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top + 1)}px)`);

        this.pointerCanvas
            .attr('width', width - 1)
            .attr('height', height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top + 1)}px)`);

        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, width, height);
            context.fillStyle = 'steelblue';
            context.strokeWidth = 1;
            context.strokeStyle = 'white';
    
        let isMouseDown = false;
        let isMouseMove = false;
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        this.pointerCanvas.on('mousedown', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);
            startX = mouseEvent[0];
            startY = mouseEvent[1];
            isMouseDown = true;
        });

        this.pointerCanvas.on('mousemove', () => {
            if (isMouseDown) {
                isMouseMove = true;
                const mouseEvent = mouse(this.pointerCanvas.node() as any);
                const moveX = mouseEvent[0];
                const moveY = mouseEvent[1];
                pointerContext.clearRect(0, 0, width, height);
                this.drawZoomBox(
                    pointerContext,
                    min([startX, moveX]), min([startY, moveY]),
                    max([startX, moveX]), max([startY, moveY])
                );
            }
        });

        this.pointerCanvas.on('mouseup', () => {
            isMouseDown = false;
            isMouseMove = false;

            const mouseEvent = mouse(this.pointerCanvas.node() as any);
            endX = mouseEvent[0];
            endY = mouseEvent[1];
            pointerContext.clearRect(0, 0, width, height);
            if (Math.abs(startX - endX) > pointRadius * 2 && Math.abs(startY - endY) > pointRadius * 2) {
                const xStartValue = x.invert(startX);
                const yStartValue = y.invert(startY);
                const xEndValue = x.invert(endX);
                const yEndValue = y.invert(endY);

                if (startX < endX && startY < endY) {
                    this.isZoom = true;
                    this.chartBase.updateAxisForZoom([
                        {
                            field: this.xField,
                            min: xStartValue,
                            max: xEndValue
                        },
                        {
                            field: this.yField,
                            min: yEndValue,
                            max: yStartValue
                        }
                    ]);
                } else {
                    this.isRestore = true;
                    this.chartBase.updateAxisForZoom([]);
                }
                
            } else {
                this.selection(
                    x, 
                    y,
                    generateData, 
                    quadTreeObj, 
                    pointerContext, 
                    {
                        x: endX, y: endY, 
                        width, height, 
                        pointRadius
                    });
            }
        });

        if (this.isRestore && this.prevCanvas) {
            context.putImageData(this.prevCanvas, 0, 0);
            this.isRestore = false;
            return;
        }

        // 갯수를 끊어 그리기
        const totalCount = generateData.length;
        if (!this.isZoom && totalCount >= 100000) {
            const svgWidth = parseInt(this.svg.style('width'));
            const svgHeight = parseInt(this.svg.style('height'));
            const progressSvg = select((this.svg.node() as HTMLElement).parentElement)
                .append('svg')
                .style('z-index', 4)
                .style('position', 'absolute')
                .style('background-color', 'none')
                .attr('width', svgWidth - 2)
                .attr('height', svgHeight - 2)
                .lower();
                           
            const shareCount = 5;
            const source = interval(500);
            const timer$ = timer((shareCount + 1) * 500);
            const example = source.pipe(takeUntil(timer$));
            example.subscribe(val => {
                for (let j = val * (totalCount / shareCount); j < (val + 1) * (totalCount / shareCount); j++ ) {
                    this.drawPoint(chartData[j], pointRadius, x, y, context);
                }
                this.drawProgress(
                    totalCount, 
                    (val + 1) * (totalCount / shareCount), 
                    {
                        width: svgWidth, 
                        height: svgHeight, 
                        target: progressSvg
                    }
                );
            }, (error) => {
                console.log('scatter plot Error', error);
            }, () => {
                if (!this.prevCanvas) {
                    this.prevCanvas = context.getImageData(0, 0, width, height);
                }
                progressSvg.remove();
            });
        } else {
            this.isZoom = false;
            chartData.forEach((point: BasicCanvasScatterPlotModel) => {
                this.drawPoint(point, pointRadius, x, y, context);
            });
            if (!this.prevCanvas) {
                this.prevCanvas = context.getImageData(0, 0, width, height);
            }
        }
    }

    selection(
        x: any, y: any, chartData: Array<any>,
        quadTreeObj: Quadtree<[number, number]>, 
        pointerContext: any, 
        geometry: {width: number, height: number, x: number, y: number, pointRadius: number}
    ) {
        pointerContext.strokeStyle = 'white';
        pointerContext.fillStyle = 'red';
        const xClicked = +x.invert(geometry.x).toFixed(2);
        const yClicked = +y.invert(geometry.y).toFixed(2);

        const closest = quadTreeObj.find(xClicked, yClicked);
        const dX = x(closest[0]);
        const dY = y(closest[1]);

        const distance = this.euclideanDistance(geometry.x, geometry.y, dX, dY);

        pointerContext.clearRect(0, 0, geometry.width, geometry.height);
        if(distance < geometry.pointRadius) {
            const selectedPoint = closest;
            const selectedIndex = this.indexing[selectedPoint[0] + ',' + selectedPoint[1]];
            
            if (selectedPoint) {
                this.itemClickSubject.next(chartData[selectedIndex]);
                this.drawPoint(
                    new BasicCanvasScatterPlotModel(
                        selectedPoint[0], 
                        selectedPoint[1], 
                        0, 
                        true,
                        {}
                    ), 
                    geometry.pointRadius, 
                    x, 
                    y, 
                    pointerContext
                );
            }
        }
    }

    drawZoomBox(
        pointerContext: any,
        startX: number, startY: number,
        endX: number, endY: number
    ) {
        pointerContext.strokeStyle = 'blue';
        pointerContext.fillStyle = 'rgba(5,222,255,0.5)';
        pointerContext.beginPath();
        pointerContext.rect(startX, startY, Math.abs(endX - startX), Math.abs(endY - startY));
        pointerContext.closePath();
        pointerContext.fill();
        pointerContext.stroke();
    }

    search(quadtree: any, x0: number, y0: number, x3: number, y3: number) {
        quadtree.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
            if (!node.length) {
                do {
                    const d = node.data;
                    d.scanned = true;
                    d.selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
                } while (node = node.next);
            }
            return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
        });
    }

    nodes(quadtree: any) {
        const nodes = [];
        quadtree.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
            nodes.push({x: x1, y: y1, width: x2 - x1, height: y2 - y1});
        });
        return nodes;
    }

    drawPoint(point: BasicCanvasScatterPlotModel, r: number, xScale: any, yScale: any, context: any) {
        const cx = xScale(point.x);
        const cy = yScale(point.y);

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

    euclideanDistance(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
}