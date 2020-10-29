import { Selection, BaseType } from 'd3-selection';
import { area, line, Area, Line, curveMonotoneX } from 'd3-shape';

import { Scale, ContainerSize, DisplayOption } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { colorDarker } from '../../chart/util/d3-svg-util';

export interface BasicAreaSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    line?: {
        strokeWidth?: number;
        strokeColor?: string;
    };
    area?: {
        isCurve?: boolean;
        opacity?: number;
        color: string;
    }
}

export class BasicAreaSeries extends SeriesBase {
    private area: Area<[number, number]>;

    private line: Line<[number, number]>;

    private xField = 'x';

    private yField = 'y';

    private lineStyle = {
        strokeWidth: 1,
        strokeColor: null
    };

    private areaStyle = {
        color: null,
        opacity: 0.7,
        isCurve: false
    }

    constructor(configuration: BasicAreaSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            this.xField = configuration.xField ?? this.xField;

            this.yField = configuration.yField ?? this.yField;

            if (configuration.area) {
                this.areaStyle.isCurve = configuration.area.isCurve ?? this.areaStyle.isCurve;
            }
        }
    }

    setSvgElement(
        svg: Selection<BaseType, any, HTMLElement, any>,
        mainGroup: Selection<BaseType, any, HTMLElement, any>
    ) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        this.area = area()
            .x((d: any) => {
                return x(d[this.xField]) + 1;
            })
            .y0(y(0))
            .y1((d: any) => {
                return y(d[this.yField]);
            });

        this.line = line()
            .x((d: any) => { return x(d[this.xField]); })
            .y((d: any) => { return y(d[this.yField]); });

        if (this.areaStyle.isCurve) {
            this.line.curve(curveMonotoneX);
            this.area.curve(curveMonotoneX);
        }

        this.mainGroup.selectAll(`.${this.selector}-path`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', this.areaStyle.color ?? option.color)
                .style('fill-opacity', this.areaStyle.opacity)
                .attr('d', this.area);

        this.mainGroup.selectAll(`.${this.selector}-line`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', `${this.selector}-line`),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', 'none')
                .style('stroke', colorDarker(this.lineStyle.strokeColor ?? option.color, 2))
                .style('stroke-width', this.lineStyle.strokeWidth)
                .attr('d', this.line);
    }
}