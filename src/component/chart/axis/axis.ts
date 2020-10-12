import { min, max } from 'd3-array';
import { scaleBand, scaleLinear, scaleTime, scalePoint } from 'd3-scale';

import { Scale, ContainerSize } from '../chart.interface';
import { Axis, Placement, ScaleType } from '../chart-configuration';

export class ChartAxis {
    static generateScaleByAxis<T = any>(
        axes: Axis[] = [],
        data: T[] = [],
        size: ContainerSize = {
            width: 0, height: 0
        },
        currentScale: {field:string, min: number, max: number}[]
    ): Scale[] {
        const returnAxes: Scale[] = [];
        axes.map((axis: Axis) => {
            let range: any = [];
            if (axis.placement === Placement.BOTTOM || axis.placement === Placement.TOP) {
                range = [0, size.width];
            } else {
                range = [size.height, 0];
            }

            let scale = null;
            let minValue = 0;
            let maxValue = 0;
            if (axis.type === ScaleType.STRING) {
                scale = scaleBand().range(range).padding(axis.padding ? +axis.padding : 0).paddingOuter(0.1);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    scale.domain(
                        data.map((item: T) => item[axis.field])
                    );
                }
            } else if (axis.type === ScaleType.POINT) {
                scale = scalePoint().range(range).padding(axis.padding ? +axis.padding : 0.1);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    scale.domain(
                        data.map((item: T) => item[axis.field])
                    );
                }
            } else {
                if (axis.type === ScaleType.TIME) {
                    // TODO: interval option 추가
                    // 참고 http://jsfiddle.net/sarathsaleem/8tmLrb9t/7/
                    scale = scaleTime().range(range);
                } else {
                    // ScaleType.NUMBER => numeric type
                    // TODO: interval option 추가 (interval 일 경우에는 argument가 3개: start, end, step)
                    scale = scaleLinear().range(range);
                }

                // POINT: zoom 시 현재 scale을 유지하기 위함.
                // min max setup
                if (currentScale.length) {
                    const tempScale = currentScale.find((scaleItem: any) => scaleItem.field === axis.field);
                    minValue = tempScale ? tempScale.min : 0;
                    maxValue = tempScale ? tempScale.max : 0;
                } else {
                    if (!axis.hasOwnProperty('max')) {
                        if (axis.type === ScaleType.TIME) {
                            axis.max = max(data.map((item: T) => new Date(item[axis.field]).getTime()));
                        } else {
                            axis.max = max(data.map((item: T) => parseFloat(item[axis.field])));
                            axis.max += Math.round(axis.max * 0.05);
                        }
                    }

                    if (!axis.hasOwnProperty('min')) {
                        if (axis.type === ScaleType.TIME) {
                            axis.min = min(data.map((item: T) => new Date(item[axis.field]).getTime()));
                        } else {
                            axis.min = min(data.map((item: T) => parseFloat(item[axis.field])));
                            axis.min -= Math.round(axis.min * 0.05);
                        }
                    }

                    minValue = axis.min;
                    maxValue = axis.max;
                }

                // axis domain label setup
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    // POINT: zoom 시 적용될 scale
                    if (currentScale.length) {
                        const reScale = currentScale.find((d: any) => d.field === axis.field);
                        minValue = reScale.min;
                        maxValue = reScale.max;
                    }

                    if (axis.type === ScaleType.NUMBER) {
                        // TODO : index string domain 지정.
                        scale.domain(
                            [minValue, maxValue]
                        );

                        if (axis.isRound === true) {
                            scale.nice();
                        }
                    } else {
                        scale.domain([new Date(minValue), new Date(maxValue)]);
                    }
                }
            }

            returnAxes.push({
                field: axis.field,
                orient: axis.placement,
                scale,
                type: axis.type,
                visible: axis.visible === false ? false : true,
                tickFormat: axis.tickFormat ? axis.tickFormat : undefined,
                tickTextParser: axis.tickTextParser ? axis.tickTextParser : undefined,
                tickSize: axis.tickSize ? axis.tickSize : undefined,
                isGridLine: axis.isGridLine === true ? true : false,
                isZoom: axis.isZoom === true ? true : false,
                min: minValue,
                max: maxValue,
                title: axis.title
            });
        });

        return returnAxes;
    }
}