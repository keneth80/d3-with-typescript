import { Selection, BaseType, select, mouse } from 'd3-selection';
import { quadtree } from 'd3-quadtree';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export class BasicCanvasScatterPlotModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    selected: boolean;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        selected: boolean
    ) {
        Object.assign(this, {
            x, y, i, selected
        })
    }
}

export interface BasicCanvasScatterPlotConfiguration {
    selector?: string;
}

export class BasicCanvasScatterPlot extends SeriesBase {
    private selector: string = 'basic-scatter';

    private selectedPoint: [number, number];

    private indexing: any = {};

    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    protected pointerCanvas: Selection<BaseType, any, HTMLElement, any>;

    constructor(configuration: BasicCanvasScatterPlotConfiguration) {
        super();
        if (configuration.selector) {
            this.selector = configuration.selector;
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
                .style('z-index', 2)
                .style('position', 'absolute');
        }

        if (!this.pointerCanvas) {
            this.pointerCanvas = select((this.svg.node() as HTMLElement).parentElement)
                .append('canvas')
                .style('z-index', 3)
                .style('position', 'absolute');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        const quadTreeObj: any = quadtree()
            .extent([[-1, -1], [width + 1, height + 1]])
            .addAll(chartData.map((d: BasicCanvasScatterPlotModel) => [d.x, d.y]));

        const pointRadius = 4;
        
        this.canvas
            .attr('width', width - 1)
            .attr('height', height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top + 1)}px)`);

        this.pointerCanvas
            .attr('width', width - 1)
            .attr('height', height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top + 1)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');

        const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');
        pointerContext.strokeStyle = 'white';
        pointerContext.fillStyle = 'red';    

        context.clearRect(0, 0, width, height);
        context.fillStyle = 'steelblue';
        context.strokeWidth = 1;
        context.strokeStyle = 'white';

        this.pointerCanvas.on('click', () => {
            const mouseEvent = mouse(this.pointerCanvas.node() as any);
    
            const xClicked = x.invert(mouseEvent[0]);
            const yClicked = y.invert(mouseEvent[1]);

            const closest = quadTreeObj.find(xClicked, yClicked);

            const dX = x(closest[0]);
            const dY = y(closest[1]);

            const distance = this.euclideanDistance(mouseEvent[0], mouseEvent[1], dX, dY);

            pointerContext.clearRect(0, 0, width, height);

            if(distance < pointRadius) {
                this.selectedPoint = closest;
                const selectedIndex = this.indexing[this.selectedPoint[0] + '.' + this.selectedPoint[1]];
                if (this.selectedPoint) {
                    this.drawPoint(new BasicCanvasScatterPlotModel(this.selectedPoint[0], this.selectedPoint[1], 0, true), pointRadius, x, y, pointerContext);
                }
            }
        });

        // TODO: 3단계에 걸쳐서 그리기.
        chartData.forEach((point: BasicCanvasScatterPlotModel, index: number) => {
            this.indexing[point.x + '.' + point.y] = index;
            this.drawPoint(point, pointRadius, x, y, context);
        });
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
