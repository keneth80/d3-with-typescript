import { Selection, BaseType, select, mouse } from 'd3-selection';
import { quadtree, Quadtree } from 'd3-quadtree';
import { min, max, range } from 'd3-array';
import { timer, of, from, Observable, Observer, Subscription } from 'rxjs';
import { switchMap, map, concatMap, mapTo, delay } from 'rxjs/operators';

import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { ChartBase } from '../../chart/chart-base';
import { delayExcute } from '../../chart/util/d3-svg-util';

export class BasicCanvasScatterPlotModel {
    x: number;
    y: number;
    z: number;
    i: number; // save the index of the point as a property, this is useful
    selected: boolean;
    obj: any;

    constructor(
        x: number,
        y: number,
        z: number,
        i: number, // save the index of the point as a property, this is useful
        selected: boolean,
        obj: any
    ) {
        Object.assign(this, {
            x, y, z, i, selected, obj
        });
    }
}

export interface BasicCanvasScatterPlotConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    pointer?: {
        radius: number,
        stroke?: {
            color: string,
            strokeWidth: number
        }
    }
}

export class BasicCanvasScatterPlot<T = any> extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    // private indexing: any = {};

    private xField: string = 'x';

    private yField: string = 'y';

    private prevCanvas: any = null;

    private bufferCanvas: any = null;

    private isRestore: boolean = false;

    private isZoom: boolean = false;

    private xMinValue: number = NaN;

    private xMaxValue: number = NaN;

    private yMinValue: number = NaN;

    private yMaxValue: number = NaN;

    private pointerRadius = 4;

    private strokeWidth: number = 1;

    private strokeColor: string = '#fff';

    private originData: Array<Array<number>> = [];

    private mouseSubscription: Subscription;

    constructor(configuration: BasicCanvasScatterPlotConfiguration) {
        super(configuration);
        if (configuration.xField) {
            this.xField = configuration.xField;
        }

        if (configuration.yField) {
            this.yField = configuration.yField;
        }

        if (configuration.pointer) {
            this.pointerRadius = configuration.pointer.radius;
            if (configuration.pointer.stroke) {
                this.strokeWidth = configuration.pointer.stroke.strokeWidth;
                this.strokeColor = configuration.pointer.stroke.color;
            }
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
    }

    drawSeries(chartData: Array<T>, scales: Array<Scale>, geometry: ContainerSize) {
        this.originQuadTree = undefined;
        this.setContainerPosition(geometry, this.chartBase);

        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        // 최초 setup why? min max를 비교해서 full scan 시에는 filtering 하지 않게 하기 위함.
        if (!this.xMinValue) {
            this.xMaxValue = xScale.min;
        }
        
        if (!this.xMaxValue) {
            this.xMaxValue = xScale.max;
        }

        if (!this.yMinValue) {
            this.yMaxValue = yScale.min;
        }

        if (!this.yMaxValue) {
            this.yMaxValue = yScale.max;
        }
        
        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        // const pointerContext = (this.pointerCanvas.node() as any).getContext('2d');

        const context = (this.canvas.node() as any).getContext('2d');
            context.clearRect(0, 0, geometry.width, geometry.height);
            context.fillStyle = 'steelblue';
            context.strokeWidth = this.strokeWidth;
            context.strokeStyle = this.strokeColor;

        console.time('filterdata');
        let initialize = false;
        if (!this.originData.length) {
            initialize = true;
        }

        let generateData = [];
        if (this.isRestore) {
            generateData = this.originData;
        } else {
            const filterData = this.xMaxValue === xmax && this.yMaxValue === ymax ? chartData : chartData
                .filter((d: T) => d[this.xField] >= xmin && d[this.xField] <= xmax && d[this.yField] >= ymin && d[this.yField] <= ymax)
                .map((d: T, i: number) => {
                    const xposition = x(d[this.xField]);
                    const yposition = y(d[this.yField]);
                    // TODO: 건수에 따라 포인트를 세분화 할지를 결정한다. 깊게 파고 들어가면 포인트가 잡히지 않음.
                    // POINT: selection을 위해 indexing을 한다.
                    // this.indexing[xposition + ';' + yposition] = d;
                    if (initialize) {
                        this.originData.push([xposition, yposition, d]);
                    }
                    return [xposition, yposition, d];
                });
            generateData = filterData;
        }

        console.timeEnd('filterdata');
        console.log('data size : ', generateData.length, this.isRestore);

        if (this.isRestore && this.bufferCanvas) {
            console.time('restoreputimage');
            context.drawImage(this.bufferCanvas, 0, 0);
            // context.putImageData(this.prevCanvas, 0, 0);
            // this.isRestore = false;
            console.timeEnd('restoreputimage');
        } else {
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
                            
                const shareCount = Math.ceil(totalCount / 20000);

                const arrayAsObservable = of(null).pipe(
                    switchMap(() => this.getObjectWithArrayInPromise(range(shareCount))),
                    map((val: any) => {
                        return (val.data);
                    }),
                    switchMap(val => from(val))
                );
        
                const eachElementAsObservable = arrayAsObservable.pipe(
                    concatMap(value => timer(400).pipe(mapTo(value))), // Not working : we want to wait 500ms for each value
                    map(val => {
                        return val;
                    })
                );
                
                eachElementAsObservable.subscribe(val => {
                    const currentIndex = parseInt(val + '');
                    const start = Math.round(currentIndex * (totalCount / shareCount));
                    const end = (currentIndex + 1) * (totalCount / shareCount) > totalCount ? totalCount : Math.round((currentIndex + 1) * (totalCount / shareCount));
                    
                    console.time('pointdraw');
                    for (let j = start; j < end; j++ ) {
                        // this.drawPoint(chartData[j], this.pointerRadius, x, y, context);
                        this.drawCircle(generateData[j], this.pointerRadius, context);
                    }
                    console.timeEnd('pointdraw');

                    this.drawProgress(
                        totalCount, 
                        (currentIndex + 1) * (totalCount / shareCount), 
                        {
                            width: svgWidth, 
                            height: svgHeight, 
                            target: progressSvg
                        }
                    );
                }, (error) => {
                    console.log('scatter plot Error', error);
                }, () => {
                    if (!this.bufferCanvas) {
                        this.bufferCanvas = document.createElement('canvas');
                        this.bufferCanvas.width = (this.canvas.node() as any).width;
                        this.bufferCanvas.height = (this.canvas.node() as any).height;
                        this.bufferCanvas.setAttribute('style', 'opacity: 0.5;');
                        this.bufferCanvas.getContext('2d').drawImage(this.canvas.node(), 0, 0);
                    }
                    context.closePath();
                    progressSvg.remove();
                });
            } else {
                this.isZoom = false;
                for (let i = 0; i < generateData.length; i++) {
                    this.drawCircle(generateData[i], this.pointerRadius, context);
                }

                if (!this.bufferCanvas) {
                    this.bufferCanvas = document.createElement('canvas');
                    this.bufferCanvas.width = (this.canvas.node() as any).width;
                    this.bufferCanvas.height = (this.canvas.node() as any).height;
                    this.bufferCanvas.getContext('2d').drawImage(this.canvas.node(), 0, 0);
                }
            }
        }

        if (!this.originQuadTree) {
            delayExcute(50, () => {
                this.originQuadTree = quadtree()
                    .extent([[-1, -1], [geometry.width + 1, geometry.height + 1]])
                    .addAll(generateData);
            });
        }
        
        this.subscription.unsubscribe();
        this.subscription = new Subscription();
        delayExcute(100, () => {
            this.addMouseEvent(x, y);
        });
    }

    destroy() {
        this.subscription.unsubscribe();
        this.canvas.remove();
    }

    private addMouseEvent(x: any, y: any) {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        this.subscription.add(this.chartBase.mouseEvent$.subscribe((event: {type: string, position: [number, number], target: Selection<BaseType, any, HTMLElement, any>}) => {
            if (event.type === 'mousemove') {

            } else if (event.type === 'mouseup') {
                endX = event.position[0];
                endY = event.position[1];

                const selected = this.search(this.originQuadTree, endX - this.pointerRadius, endY - this.pointerRadius, endX + this.pointerRadius, endY + this.pointerRadius);
            
                if (selected.length) {
                    
                    const selectedItem = selected[0];
                    const selectX = selectedItem[0];
                    const selectY = selectedItem[1];
                    // const selectX = Math.round(selected[selected.length - 1][0]);
                    // const selectY = Math.round(selected[selected.length - 1][1]);

                    if (selectedItem) {
                        this.itemClickSubject.next(selectedItem);
                        const pointerContext = (event.target.node() as any).getContext('2d');
                        pointerContext.fillStyle = 'red';
                        pointerContext.strokeStyle = 'white';
                        this.drawCircle([selectX, selectY], this.pointerRadius, pointerContext);
                    }
                }
            } else if (event.type === 'mousedown') {
                startX = event.position[0];
                startY = event.position[1];
            } else if (event.type === 'zoomin') {
                this.isRestore = false;
                endX = event.position[0];
                endY = event.position[1];

                // TODO: zoom 스케일이 깊어질 수록 정확도가 떨어짐.
                const xStartValue = x.invert(startX);
                const yStartValue = y.invert(startY);
                const xEndValue = x.invert(endX);
                const yEndValue = y.invert(endY);
                // this.chartBase.updateAxisForZoom([
                //     {
                //         field: this.xField,
                //         min: xStartValue,
                //         max: xEndValue
                //     },
                //     {
                //         field: this.yField,
                //         min: yEndValue,
                //         max: yStartValue
                //     }
                // ]);
            } else if (event.type === 'zoomout') {
                this.isRestore = true;
                // delayExcute(50, () => {
                //     this.chartBase.updateAxisForZoom([]);
                // });
            } else {

            }
        }));
    }

    private setContainerPosition(geometry: ContainerSize, chartBase: ChartBase) {
        this.canvas
            .attr('width', geometry.width - 1)
            .attr('height', geometry.height - 1)
            .style('transform', `translate(${(chartBase.chartMargin.left + 1)}px, ${(chartBase.chartMargin.top + 1)}px)`);
    }

    private getObjectWithArrayInPromise(list: Array<any>) {
		const data = list.map((item: any, index: number) => index);
        return new Promise(resolve => {
            setTimeout(() => resolve({
                data
            }), 20);
        });
    }

    private drawZoomBox(
        pointerContext: any,
        startX: number, startY: number,
        endX: number, endY: number
    ) {
        pointerContext.strokeStyle = 'blue';
        pointerContext.fillStyle = 'rgba(5,222,255,0.5)';
        pointerContext.beginPath();
        pointerContext.rect(startX, startY, Math.abs(endX - startX), Math.abs(endY - startY));
        pointerContext.fill();
        pointerContext.stroke();
    }

    private search(quadtree: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        quadtree.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
            if (!node.length) {
                do {
                    const d = node.data;
                    const selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
                    if (selected) {
                        temp.push(d);
                    }
                } while (node = node.next);
            }
            return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
        });

        return temp;
    }

    private drawCircle(point: [number, number], r: number, context: any) {
        if (point[0] < 0 || point[1] < 0) {
            return;
        }

        context.beginPath();
        context.arc(point[0], point[1], r, 0, 2 * Math.PI);
        context.fill();
        // context.stroke();
    }
}