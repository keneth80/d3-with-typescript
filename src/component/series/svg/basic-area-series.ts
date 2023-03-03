import {BaseType, Selection} from 'd3-selection';
import {area, Area, curveMonotoneX, line, Line} from 'd3-shape';

import {ContainerSize, DisplayOption, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {colorDarker} from '../../chart/util/d3-svg-util';

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
    };
}

export class BasicAreaSeries extends SeriesBase {
    private area: Area<[number, number]>;

    private line: Line<[number, number]>;

    private lineStyle: any = {
        strokeWidth: 1,
        strokeColor: null
    };

    private areaStyle: any = {
        color: null,
        opacity: 0.7,
        isCurve: false
    };

    private config: BasicAreaSeriesConfiguration;

    constructor(configuration: BasicAreaSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        this.areaStyle.isCurve = configuration?.area?.isCurve ?? this.areaStyle.isCurve;
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        this.color = this.areaStyle.color ?? option.color;
        this.area = area()
            .x((d: any) => {
                return x(d[this.config.xField]) + 1;
            })
            .y0(y(0))
            .y1((d: any) => {
                return y(d[this.config.yField]);
            });

        this.line = line()
            .x((d: any) => {
                return x(d[this.config.xField]);
            })
            .y((d: any) => {
                return y(d[this.config.yField]);
            });

        if (this.areaStyle.isCurve) {
            this.line.curve(curveMonotoneX);
            this.area.curve(curveMonotoneX);
        }

        this.mainGroup
            .selectAll(`.${this.selector}-path`)
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                (update) => update,
                (exit) => exit.remove
            )
            .style('fill', this.color)
            .style('fill-opacity', this.areaStyle.opacity)
            .attr('d', this.area);

        this.mainGroup
            .selectAll(`.${this.selector}-line`)
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-line`),
                (update) => update,
                (exit) => exit.remove
            )
            .style('fill', 'none')
            .style('stroke', colorDarker(this.lineStyle.strokeColor ?? this.color, 2))
            .style('stroke-width', this.lineStyle.strokeWidth)
            .attr('d', this.line);
    }
}
