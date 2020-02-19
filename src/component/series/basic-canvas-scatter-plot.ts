import { Selection, BaseType, select } from 'd3-selection';
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
    canvasClass?: string;
}

export class BasicCanvasScatterPlot extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    private selector: string = 'basic-scatter';

    private canvasClass: string = 'basic-scatter-plot';

    constructor(configuration: BasicCanvasScatterPlotConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            if (configuration.canvasClass) {
                this.canvasClass = configuration.canvasClass;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        this.canvas = select(this.canvasClass);
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        const quadTree = quadtree(chartData);

        const pointRadius = 6;
        
        let active: any;
        
        this.mainGroup
            .attr('transform', `translate( ${this.chartBase.chartMargin.left}, ${this.chartBase.chartMargin.top})`);
        this.canvas
            .attr('width', width - 1)
            .attr('height', height - 1)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top + 1)}px)`);

        const context = (this.canvas.node() as any).getContext('2d');
        

        context.clearRect(0, 0, width, height);
        context.fillStyle = 'steelblue';
        context.strokeWidth = 1;
        context.strokeStyle = 'white';

        chartData.forEach((point: BasicCanvasScatterPlotModel) => {
            if (!point.selected) {
                this.drawPoint(point, pointRadius, x, y, context);
            } else {
                active = point;
            }
        });

        // ensure that the actively selected point is drawn last
        // so it appears at the top of the draw order
        if (active) {
            context.fillStyle = 'red';
            this.drawPoint(active, pointRadius, x, y, context);
            context.fillStyle = 'steelblue';
        }
    }

    drawPoint(point: BasicCanvasScatterPlotModel, r: number, xScale: any, yScale: any, context: any) {
        const cx = xScale(point.x);
        const cy = yScale(point.y);

        // NOTE; each point needs to be drawn as its own path
        // as every point needs its own stroke. you can get an insane
        // speed up if the path is closed after all the points have been drawn
        // and don't mind points not having a stroke
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