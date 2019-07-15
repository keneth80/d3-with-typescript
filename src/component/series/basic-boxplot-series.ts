import { Selection, BaseType } from 'd3-selection';
import { histogram } from 'd3-array';
import { Subject, Observable } from 'rxjs';

import { ISeries } from '../chart/series.interface';
import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicBoxplotSeriesConfiguration {
    selector?: string;
    xField: string;
    maxWidth?: number;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export interface BoxplotModel {
    key: string;
    counts?: number;
    quartile?: number;
    whiskers?: Array<number>;
    color?: string;
}

export class BasicBoxplotSeries extends SeriesBase {
    private itemClass: string = 'basic-boxplot';

    private itemClickSubject: Subject<any> = new Subject();

    private xField: string;

    private maxWidth: number;

    constructor(configuration: BasicBoxplotSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.itemClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.maxWidth) {
                this.maxWidth = configuration.maxWidth;
            }
        }
    }

    get currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.itemClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.itemClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        let padding = 0;
        let barWidth = 10;

        if (x.bandwidth) {
            barWidth = x.bandwidth();
            padding = x.bandwidth() / 2;
        }

        if (this.maxWidth && this.maxWidth < barWidth) {
            barWidth = this.maxWidth;
        }

        // Draw the box plot vertical lines
        this.mainGroup.selectAll('.verticalLines')
            .data(chartData)
            .join(
                (enter) => enter.append('line').attr('class', 'verticalLines'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x1', (datum: any) => { return x(datum.key) + padding; })
            .attr('y1', (datum: any) => { return y(datum.whiskers[0]); })
            .attr('x2', (datum: any) => { return x(datum.key) + padding; })
            .attr('y2', (datum: any) => { return y(datum.whiskers[1]); })
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('fill', 'none');

        // Draw the boxes of the box plot, filled and on top of vertical lines
        this.mainGroup.selectAll('.quartile')
            .data(chartData)
            .join(
                (enter) => enter.append('rect').attr('class', 'quartile'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', barWidth)
            .attr('height', (datum: any) => {
                const quartiles = datum.quartile;
                const height = y(quartiles[0]) - y(quartiles[2]);      
                return height;
            })
            .attr('x', (datum: any) => { return x(datum.key) + padding - (barWidth/2); })
            .attr('y', (datum: any) => { return y(datum.quartile[2]); })
            .attr('fill', (datum: any) => { return datum.color; })
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        // Now render all the horizontal lines at once - the whiskers and the median
        const horizontalLineConfigs = [
            // Top whisker
            {
                type: 'top',
                x1: (datum: any) => { return x(datum.key) + padding - barWidth/2 },
                y1: (datum: any) => { return y(datum.whiskers[0]) },
                x2: (datum: any) => { return x(datum.key) + padding + barWidth/2 },
                y2: (datum: any) => { return y(datum.whiskers[0]) }
            },
            // Median line
            {
                type: 'median',
                x1: (datum: any) => { return x(datum.key) + padding - barWidth/2 },
                y1: (datum: any) => { return y(datum.quartile[1]) },
                x2: (datum: any) => { return x(datum.key) + padding + barWidth/2 },
                y2: (datum: any) => { return y(datum.quartile[1]) }
            },
            // Bottom whisker
            {
                type: 'bottom',
                x1: (datum: any) => { return x(datum.key) + padding - barWidth/2 },
                y1: (datum: any) => { return y(datum.whiskers[1]) },
                x2: (datum: any) => { return x(datum.key) + padding + barWidth/2 },
                y2: (datum: any) => { return y(datum.whiskers[1]) }
            }
        ];

        for(let i = 0; i < horizontalLineConfigs.length; i++) {
            const lineConfig = horizontalLineConfigs[i];

            // Draw the whiskers at the min for this series
            this.mainGroup.selectAll(`.whiskers-${lineConfig.type}`)
                .data(chartData)
                .join(
                    (enter) => enter.append('line').attr('class', `whiskers-${lineConfig.type}`),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x1', lineConfig.x1)
                .attr('y1', lineConfig.y1)
                .attr('x2', lineConfig.x2)
                .attr('y2', lineConfig.y2)
                .attr('stroke', '#000')
                .attr('stroke-width', 1)
                .attr('fill', 'none');
        }
    }
}