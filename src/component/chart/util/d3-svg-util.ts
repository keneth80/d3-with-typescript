import { color } from 'd3-color';
import { select } from 'd3-selection';

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
        const x = text.attr('x');
        const y = text.attr('y');
        const dy = 0; //parseFloat(text.attr('dy')),
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

export const wrapTextByRowLimit = (text: any, width: number, limitRowCount: number = 100) => {
    // let words = text.text().split(/\s+/).reverse(),
    if (text.node().getComputedTextLength() < width) {
        return text;
    }

    const compare = osName.indexOf('Windows') > -1 ? 8 : 2;
    
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

export const getTextWidth = (text, fontSize, fontFace) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = fontSize + 'px ' + fontFace;
    const targetText: TextMetrics = context.measureText(text);
    const width = targetText.width;
    return width;
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
}

export const drawSvgCheckBox = () => {
    
}
