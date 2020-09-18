import { color } from 'd3-color';
import { select, event, Selection, BaseType } from 'd3-selection';
import { line } from 'd3-shape';
import { Placement } from '../chart-configuration';
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis';
import { LegendItem } from '../chart.interface';
import { Observable, Observer } from 'rxjs';
import { delay } from 'rxjs/operators';

export const getTransformByArray = (transform: string = 'translate(0, 0)'): Array<string> => {
    const translateString = transform.substring(transform.indexOf('translate('), transform.indexOf(')') + 1);
    let translate = ['0', '0'];
    const agent = navigator.userAgent.toLowerCase();
    if ((navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || 
        (agent.indexOf('msie') != -1) ||
        (agent.indexOf('edge') != -1)) {
        // ie일 경우
        const parseTranslate = translateString.replace('translate(', '').replace(')', '');
        translate = parseTranslate.split(/\s+/);
        // ie일 경우 y좌표 0을 아예 생략해버림.
        if (translate.length < 2) {
            translate.push('0');
        }
    } else {
        // ie가 아닐 경우
        // translate = translateString.replace('translate(', '').replace(')', '').split(/\s*,\s/);
        translate = translateString.replace('translate(', '').replace(')', '').split(',');
    }
    if (transform.indexOf('scale(') > -1) {
        const scaleString = transform.substring(translateString.length, transform.lastIndexOf(')') + 1);
        const scale = scaleString.replace('scale(', '').replace(')', '');
        translate.push(scale);
    }
    return translate;
};

export const isIE = (): boolean => {
    let returnValue: boolean = false;
    const agent = navigator.userAgent.toLowerCase();
    if ((navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || 
        (agent.indexOf('msie') != -1) ||
        (agent.indexOf('edge') != -1)) {
        // ie일 경우
        returnValue = true;
    }
    return returnValue;
};

export const colorDarker = (fill: any, value: number = 2): any => {
    return color(fill).darker(value);
};

export const guid = () => {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

export const textWrapping = (text: any, width: number) => {
    text.each((d: any, index: number, node: any) => {
        
        const text = select(node[index]);
        let line = [];
        // const words = text.text().split(/\s+/).reverse();
        const words = text.text().split('').reverse();
        let word = null;
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const x = text.attr('x') || 0;
        const y = text.attr('y') || 0;
        const dy = parseFloat(text.attr('dy') || '0');
        let tspan = text.text(null)
                        .append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('dy', dy + 'em');
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(''));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(''));
                line = [word];
                // line.length = 0;
                // line.concat([word]);
                tspan = text.append('tspan')
                            .attr('x', x)
                            .attr('y', y)
                            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                            .text(word);
            }
        }
    });
}

export const textBreak = (target: any, pattern: any = /\s+/) => { // /(\n|\r\n)/g
    target.each((d: any, index: number, node: any) => {
        
        const text = select(node[index]);
        let line = [];
        const words = text.text().split(pattern).reverse();
        // const words = text.text().split('').reverse();
        let word = null;
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const x = text.attr('x') || 0;
        const y = text.attr('y') || 0;
        const dy = parseFloat(text.attr('dy') || '0');
        let tspan = text.text(null)
                        .append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('dy', dy + 'em');
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(''));
            line.pop();
            tspan.text(line.join(''));
            line = [word];
            // line.length = 0;
            // line.concat([word]);
            tspan = text.append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                        .text(word);
        }
    });
}

export const getOsName = () => {
    let OSName = 'Unknown';
    // if (window.navigator.userAgent.indexOf('Windows NT 10.0')!= -1) OSName='Windows 10';
    // if (window.navigator.userAgent.indexOf('Windows NT 6.2') != -1) OSName='Windows 8';
    // if (window.navigator.userAgent.indexOf('Windows NT 6.1') != -1) OSName='Windows 7';
    // if (window.navigator.userAgent.indexOf('Windows NT 6.0') != -1) OSName='Windows Vista';
    // if (window.navigator.userAgent.indexOf('Windows NT 5.1') != -1) OSName='Windows XP';
    // if (window.navigator.userAgent.indexOf('Windows NT 5.0') != -1) OSName='Windows 2000';
    // if (window.navigator.userAgent.indexOf('Mac')            != -1) OSName='Mac/iOS';
    // if (window.navigator.userAgent.indexOf('X11')            != -1) OSName='UNIX';
    // if (window.navigator.userAgent.indexOf('Linux')          != -1) OSName='Linux';
    if (window.navigator.userAgent.indexOf('Windows') != -1) OSName='Windows';
    if (window.navigator.userAgent.indexOf('Mac') != -1) OSName='Mac/iOS';
    if (window.navigator.userAgent.indexOf('X11') != -1) OSName='UNIX';
    if (window.navigator.userAgent.indexOf('Linux') != -1) OSName='Linux';
    return OSName;
}

const osName: string = getOsName();

export const wrapTextByRowLimit = (text: any, width: number, limitRowCount: number = 10) => {
    // let words = text.text().split(/\s+/).reverse(),
    if (text.node().getComputedTextLength() < width) {
        return text;
    }

    const compare = osName.indexOf('Windows') > -1 ? (isIE() ? 0 : 4) : 3;
    
    let words: Array<string> = text.text().split('').reverse(),
        word: string,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr('y') || 0,
        dy = parseFloat(text.attr('dy')) || 0,
        lineCount = 1;
    let tspan = text.text(null).append('tspan').attr('x', 2).attr('y', y).attr('dy', dy + 'em');
    let isOver = false;
    while ((word = words.pop()) && !isOver) {
        line.push(word);
        tspan.text(line.join(''));
        if (tspan.node().getComputedTextLength() > width - compare) { // OS에 따라 ...의 사이즈 차이가 있음.
            lineCount++;
            line.pop();
            tspan.text(line.join(''));
            line = [word];
            tspan = text.append('tspan').attr('x', 2).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
            if (lineCount > limitRowCount) {
                isOver = true;
                const targetText = text.selectAll('tspan').filter((d: any, i: number) => i === limitRowCount - 1);
                const tempStr = targetText.text();
                targetText.text(tempStr.substring(0, tempStr.length - 1) + '...');
                tspan.remove();
            }
        }
    }
    return text;
};

export const getTextWidth = (text: string, fontSize: number, fontFace: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = fontSize + 'px ' + fontFace;
    const targetText: TextMetrics = context.measureText(text);
    const width = targetText.width;
    return width;
};

export const getTextWidthByComputedTextLength = (text: any) => {
    return text.getComputedTextLength();
};

export const getMaxText = (texts: string[] = []) => {
    let maxLength = 0;
    let targetIndex = 0;
    texts.forEach((text: string, index: number) => {
        if (maxLength < text.length) {
            maxLength = text.length;
            targetIndex = index;
        }
    });

    return texts[targetIndex];
};

export const drawSvgCheckBox = <T = any>(
    selection: any,
    clickEvent: any = null,
    size: number = 10,
    x: number = 0,
    y: number = 0,
    rx: number = 0,
    ry: number = 0,
    markStrokeWidth: number = 1,
    boxStrokeWidth: number = 1,
    checked: boolean = true
): Selection<BaseType, any, BaseType, any> => {

    const g: Selection<BaseType, any, BaseType, any> = selection.selectAll('.checkbox-group')
        .data((d: T) => [
            {
                size, x, y, rx, ry, markStrokeWidth, boxStrokeWidth, checked, data: d
            }
        ])
        .join(
            (enter) => enter.append('g').attr('class', 'checkbox-group'),
            (update) => update,
            (exit) => exit.remove()
        );
    
    const box = g.selectAll('.checkbox-background')
        .data((d: any) => [d])
        .join(
            (enter) => enter.append('rect').attr('class', 'checkbox-background'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('width', (d: any) => d.size)
        .attr('height', (d: any) => d.size)
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
        .attr('rx', (d: any) => d.rx)
        .attr('ry', (d: any) => d.ry)
        .style('fill-opacity', 0)
        .style('stroke-width', (d: any) => d.boxStrokeWidth)
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdges');

    const coordinates: Array<any> = [
        [x + (size / 8), y + (size / 3)],
        [x + (size / 2.2), (y + size) - (size / 4)],
        [(x + size) - (size / 8), (y + (size / 10))]
    ];

    const lineObj = line()
            .x((d: any) => { return d[0]; })
            .y((d: any) => { return d[1]; });

    const mark = g.selectAll('.checkbox-mark')
        .data((d: any) => [d])
        .join(
            (enter) => enter.append('path').attr('class', 'checkbox-mark'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('d', lineObj(coordinates))
        .style('shape-rendering', 'crispEdges')
        .style('stroke-width', (d: any) => d.markStrokeWidth)
        .style('stroke', 'black')
        .style('fill', 'none')
        .style('opacity', (d: any) => (d.checked)? 1 : 0);

    g.on('click', (d: any, index: number, nodeList: any) => {
        d.checked = !d.checked;
        mark.style('opacity', (d.checked)? 1 : 0);

        if (clickEvent) {
            clickEvent(d.data, index, nodeList);
        }
        event.stopPropagation();
    });

    return g;
};

export const getAxisByPlacement = (placement: string, scale: any) => {
    if (placement === Placement.TOP) {
        return axisTop(scale);
    } else if (placement === Placement.LEFT) {
        return axisLeft(scale);
    } else if (placement === Placement.RIGHT) {
        return axisRight(scale);
    } else {
        return axisBottom(scale);
    }
};

export const drawLegendColorItemByRect = (
    targetGroup: Selection<BaseType, LegendItem, BaseType, any>, 
    legendItemSize: {width: number, height: number},
    keys: Array<LegendItem> = [], 
    colors: Array<string> = []
) => {
    return targetGroup.selectAll('.legend-item')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', 'legend-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', legendItemSize.width)
            .attr('height', legendItemSize.height)
            .attr('fill', (d: LegendItem) => {
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                return colors[index];
            });
};

export const drawLegendColorItemByCircle = (
    targetGroup: Selection<BaseType, LegendItem, BaseType, any>, 
    legendItemSize: {width: number, height: number},
    keys: Array<LegendItem> = [], 
    colors: Array<string> = []
) => {
    return targetGroup.selectAll('.legend-item')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('circle').attr('class', 'legend-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('r', legendItemSize.width / 2)
            .attr('cx', legendItemSize.width / 2)
            .attr('cy', legendItemSize.width / 2)
            .attr('fill', (d: LegendItem) => {
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                return colors[index];
            });
};

export const drawLegendColorItemByLine = (
    targetGroup: Selection<BaseType, LegendItem, BaseType, any>, 
    legendItemSize: {width: number, height: number},
    keys: Array<LegendItem> = [], 
    colors: Array<string> = []
) => {
    return targetGroup.selectAll('.legend-item')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', 'legend-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', legendItemSize.width)
            .attr('height', 3)
            .attr('y', legendItemSize.width / 2 - 1)
            .attr('fill', (d: LegendItem) => {
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                return colors[index];
            });
}

export const delayExcute = (delayTime: number = 100, callback: any) => {
    Observable.create((observ: Observer<boolean>) => {
        observ.next(true);
        observ.complete();
    })
    .pipe(
        delay(delayTime)
    ).subscribe(() => {
        callback();
    });
}
