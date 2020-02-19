import { Selection, BaseType, select, event } from 'd3-selection';
import { brush } from 'd3-brush';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { FunctionsBase } from '../chart/functions-base';

export interface BasicBrushSelectionConfiguration {
    targetGroup: string;
    xField: string;
    yField: string;
    xDirection: string;
    yDirection: string;
    direction?: string; // both, x, y default: both
}

export class BasicBrushSelection extends FunctionsBase {
    private targetGroup: string = '';

    private targetElements: any;

    private xField: string;

    private yField: string;

    private xDirection: string = 'bottom';

    private yDirection: string = 'left';

    private direction: string = 'both';

    private brushSelectionSubject: Subject<any> = new Subject();

    constructor(configuration: BasicBrushSelectionConfiguration) {
        super();
        if (configuration) {
            if (configuration.targetGroup) {
                this.targetGroup = configuration.targetGroup;
            }

            if (configuration.direction) {
                this.direction = configuration.direction;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.xDirection) {
                this.xDirection = configuration.xDirection;
            }

            if (configuration.yDirection) {
                this.yDirection = configuration.yDirection;
            }
        }
    }

    get $selectionItems(): Observable<Array<any>> {
        return this.brushSelectionSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.mainGroup = mainGroup;
    }

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === this.yDirection).scale;

        this.targetElements = this.mainGroup.select(`.${this.targetGroup}`).selectAll('*');

        const updateChart = () => {
            const extent = event.selection;

            this.targetElements.classed('selected', (d: any) => {
                const returnValue = this.isBrushed(extent, x(d[this.xField]), y(d[this.yField]));
                return returnValue;
            });
        };

        const dispatchSelection = () => {
            const targetData = [];
            
            this.targetElements.filter((d: any, i: number, nodeList: any) => {
                return select(nodeList[i]).attr('class').indexOf('selected') > -1;
            }).each((d: any) => {
                targetData.push(d);
            });

            if (targetData.length) {
                this.brushSelectionSubject.next(targetData);
            }
        }

        this.mainGroup.call(
            brush()
            .extent([ [0, 0], [width, height] ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on('start brush', updateChart)
            .on('end', dispatchSelection)
        );
    }

    isBrushed = (brush_coords: Array<any>, cx: number, cy: number) => {
        const x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
       return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
   }
}