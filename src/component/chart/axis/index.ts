import {max, min} from 'd3-array';
import {brushX, brushY} from 'd3-brush';
import {easeLinear} from 'd3-ease';
import {scaleBand, scaleLinear, scalePoint, scaleTime} from 'd3-scale';
import {transition} from 'd3-transition';

import {BaseType, select, Selection} from 'd3-selection';
import {Align, Axes, AxisTitle, Margin, Placement, ScaleType} from '../chart-configuration';
import {ContainerSize, Scale} from '../chart.interface';
import {axisSetupByScale} from '../scale';
import {delayExcute, textWrapping} from '../util';

export const generateScaleByAxis = <T = any>(
    axes: Axes[] = [],
    data: any[] = [],
    size: ContainerSize = {
        width: 0,
        height: 0
    },
    currentScale: {field: string; min: number; max: number}[],
    isRealTime: boolean = false
): Scale[] => {
    const returnAxes: Scale[] = [];
    axes.map((axis: Axes) => {
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
            scale = scaleBand()
                .range(range)
                .padding(axis.padding ? +axis.padding : 0)
                .paddingOuter(0.1);
            if (axis.domain) {
                scale.domain(axis.domain);
            } else {
                scale.domain(data.map((item: any) => (item as any)[axis.field]));
            }
        } else if (axis.type === ScaleType.POINT) {
            scale = scalePoint()
                .range(range)
                .padding(axis.padding ? +axis.padding : 0.1);
            if (axis.domain) {
                scale.domain(axis.domain);
            } else {
                scale.domain(data.map((item: any) => (item as any)[axis.field]));
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
                        axis.max = max(data.map((item: any) => new Date(item[axis.field]).getTime()));
                    } else {
                        axis.max = max(data.map((item: any) => parseFloat(item[axis.field])));
                        axis.max += Math.round(axis.max * 0.05);
                    }
                }

                if (!axis.hasOwnProperty('min')) {
                    if (axis.type === ScaleType.TIME) {
                        axis.min = min(data.map((item: any) => new Date(item[axis.field]).getTime()));
                    } else {
                        axis.min = min(data.map((item: any) => parseFloat(item[axis.field])));
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
                    scale.domain([minValue, maxValue]);

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
            gridLine: axis.gridLine,
            zeroLine: axis.zeroLine,
            isZoom: axis.isZoom === true ? true : false,
            min: minValue,
            max: maxValue,
            title: axis.title
        });
    });

    return returnAxes;
};

export const drawAxisByScale = (
    svgGeometry: ContainerSize,
    margin: Margin,
    isCustomMargin: boolean,
    scale: Scale,
    targetGroup: Selection<BaseType, any, HTMLElement, any>,
    defaultAxisLabelStyle: any,
    defaultAxisTitleStyle: any,
    axisTitleMargin: Margin,
    isRealTime: boolean = true
) => {
    const padding = 10; // 10 는 axis 여백.
    const orientedAxis: any = axisSetupByScale(scale);

    let maxTextWidth = 0;
    let bandWidth = -1;

    if (scale.type === ScaleType.STRING) {
        bandWidth = scale.scale.bandwidth();
    }

    if (scale.visible) {
        // TODO: 우선은 x 축만 tansition 적용 텍스트 길이 체크하는 로직이 돌면서 transition 적용은 아직은 어려움.
        if (isRealTime && (scale.orient === Placement.BOTTOM || scale.orient === Placement.TOP)) {
            const transitionObj = transition().duration(500).ease(easeLinear);
            targetGroup.transition(transitionObj);
        }
        targetGroup
            // .transition(transitionObj)
            .call(orientedAxis)
            .selectAll('text')
            .style('font-size', defaultAxisLabelStyle.font.size + 'px')
            .style('font-family', defaultAxisLabelStyle.font.family);
        // .style('font-weight', 100)
        // .style('stroke-width', 0.5)
        // .style('stroke', this.defaultAxisLabelStyle.font.color);
    }

    if (scale.tickTextParser) {
        delayExcute(50, () => {
            targetGroup.selectAll('text').text((d: any) => {
                return scale.tickTextParser(d);
            });
        });
    }

    // if (scale.isZoom === true) {
    //     ChartAxis.setupBrush(svgGeometry, margin, scale, targetGroup, updateBrushHandler);
    // }

    // axis의 텍스트가 길어지면 margin도 덩달아 늘어나야함. 단, config.margin이 없을 때
    // TODO: axis transition을 걸면 delay 때문에 텍스트 길이 체크가 안되니 트랜지션의 duration 만큼 지연이 필요하다.
    if (!isCustomMargin) {
        // 가장 긴 텍스트를 찾아서 사이즈를 저장하고 margin에 더해야함
        let textLength = 0;
        let longTextNode: any = null;
        if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
            targetGroup.selectAll('.tick').each((d: any, index: number, node: any) => {
                const currentTextSize = (d + '').length;
                if (textLength < currentTextSize) {
                    textLength = currentTextSize;
                    longTextNode = node[index];
                }
            });

            if (longTextNode) {
                const textWidth = Math.round(longTextNode.getBoundingClientRect().width);
                if (maxTextWidth < textWidth) {
                    maxTextWidth = textWidth;
                }
            }
        } else {
            targetGroup.selectAll('.tick').each((d: any, index: number, node: any) => {
                // string일 때 bandWidth 보다 텍스트 사이즈가 더 크면 wordrap한다.
                if (bandWidth > 0) {
                    const textNode: any = select(node[index]).select('text');
                    const textNodeWidth = textNode.node().getComputedTextLength();
                    const currentTextSize = (d + '').length;
                    if (textNodeWidth > bandWidth) {
                        textWrapping(textNode, bandWidth);
                    }

                    if (textLength < currentTextSize) {
                        textLength = currentTextSize;
                        longTextNode = node[index];
                    }
                }
            });

            if (longTextNode) {
                const textHeight = Math.round(longTextNode.getBoundingClientRect().height);
                if (maxTextWidth < textHeight) {
                    maxTextWidth = textHeight;
                }
            }
        }
    }

    if (scale.zeroLine && scale.min < 0) {
        setupZeroLine(svgGeometry, scale, targetGroup);
    } else {
        targetGroup.selectAll(`.${scale.orient}-${scale.field}-zero-line`).remove();
    }

    if (scale.title) {
        targetGroup
            .selectAll(`.axis-${scale.orient}-title`)
            .data([scale.title])
            .join(
                (enter) => enter.append('text').attr('class', `axis-${scale.orient}-title`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('dy', () => {
                return scale.orient === Placement.TOP ? '0em' : '1em';
            })
            .style('text-anchor', (d: AxisTitle) => {
                let anchor = '';
                if (d.align === Align.TOP) {
                    anchor = 'end';
                } else if (d.align === Align.BOTTOM) {
                    anchor = 'start';
                } else {
                    anchor = 'middle';
                }
                return anchor;
            })
            .style('font-weight', 100)
            .style('fill', defaultAxisTitleStyle.font.color)
            .style('font-size', defaultAxisTitleStyle.font.size)
            .style('font-family', defaultAxisTitleStyle.font.family)
            .text((d: AxisTitle) => {
                return d.content;
            })
            .attr('transform', (d: AxisTitle) => {
                return scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT ? 'rotate(-90)' : '';
            })
            .attr('y', (d: AxisTitle, index: number, node: any) => {
                const titlePadding = 5;
                let y = 0;
                if (scale.orient === Placement.LEFT) {
                    y = 0 - (margin.left + axisTitleMargin.left - titlePadding);
                } else if (scale.orient === Placement.RIGHT) {
                    y = margin.right - titlePadding;
                } else if (scale.orient === Placement.BOTTOM) {
                    y = margin.bottom - titlePadding;
                } else {
                    y = -axisTitleMargin.top - titlePadding;
                }
                return y;
            })
            .attr('x', (d: AxisTitle) => {
                let x = 0;
                if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
                    if (d.align === Align.TOP) {
                        x = 0;
                    } else if (d.align === Align.BOTTOM) {
                        x = 0 - svgGeometry.height;
                    } else {
                        x = 0 - svgGeometry.height / 2;
                    }
                } else if (scale.orient === Placement.BOTTOM || scale.orient === Placement.TOP) {
                    if (d.align === Align.LEFT) {
                        x = padding;
                    } else if (d.align === Align.RIGHT) {
                        x = svgGeometry.width - padding;
                    } else {
                        x = svgGeometry.width / 2;
                    }
                }
                return x;
            });
    }

    return maxTextWidth;
};

export const setupZeroLine = (
    svgGeometry: ContainerSize,
    scale: Scale,
    targetGroup: Selection<BaseType, any, HTMLElement, any>
): Selection<BaseType, any, BaseType, any> => {
    const zeroLine = targetGroup
        .selectAll(`.${scale.orient}-${scale.field}-zero-line`)
        .data([scale])
        .join((enter) => enter.append('line').attr('class', `${scale.orient}-${scale.field}-zero-line`))
        .style('stroke', scale.zeroLine.color ?? '#000')
        .style('stroke-width', 1);
    if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
        zeroLine.attr('y1', scale.scale(0)).attr('y2', scale.scale(0)).attr('x2', svgGeometry.width);
    } else {
        zeroLine.attr('x1', scale.scale(0)).attr('y1', -svgGeometry.height).attr('x2', scale.scale(0)).attr('y2', 0);
    }

    return zeroLine;
};

export const setupBrush = (
    svgGeometry: ContainerSize,
    margin: Margin,
    scale: Scale,
    targetGroup: Selection<BaseType, any, HTMLElement, any>,
    updateBrushHandler: any
) => {
    let brush: any = null;
    if (scale.type === ScaleType.NUMBER || scale.type === ScaleType.TIME) {
        if (scale.orient === Placement.RIGHT || scale.orient === Placement.LEFT) {
            let left = 0;
            let width = 0;

            if (scale.orient === Placement.LEFT) {
                left = -1 * margin.left;
            } else {
                width = svgGeometry.width;
            }

            brush = brushY().extent([
                [left, 0],
                [width, svgGeometry.height]
            ]);
        } else {
            let top = 0;
            let height = 0;

            // top margin 때문에 처리.
            if (scale.orient === Placement.TOP) {
                top = margin.top * -1;
            } else {
                height = margin.bottom;
            }

            brush = brushX().extent([
                [0, top],
                [svgGeometry.width, height]
            ]);
        }
        brush.on('end', () => {
            updateBrushHandler(scale.orient, brush);
        });
    }

    if (brush) {
        if (!targetGroup.select('.brush' + scale.orient).node()) {
            targetGroup.append('g').attr('class', 'brush' + scale.orient);
        }
        targetGroup.select('.brush' + scale.orient).call(brush);
    }
};
