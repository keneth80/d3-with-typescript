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
}