import {BaseType, Selection} from 'd3';

const defaultShaderType = ['VERTEX_SHADER', 'FRAGMENT_SHADER'];

export const hexToRgb = (hex: any) =>
    hex
        .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m: number, r: number, g: number, b: number) => '#' + r + r + g + g + b + b)
        .substring(1)
        .match(/.{2}/g)
        .map((x: string) => parseInt(x, 16));

export const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');

export const createProgramFromScripts = (gl: any, shaderScriptIds: any, optAttribs: any, optLocations: any, optErrorCallback: any) => {
    const shaders = [];
    for (let ii = 0; ii < shaderScriptIds.length; ++ii) {
        shaders.push(createShaderFromScript(gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], optErrorCallback));
    }
    return createProgram(gl, shaders, optAttribs, optLocations, optErrorCallback);
};

export const createProgramFromSources = (gl: any, shaderSources: string[], optAttribs: any, optLocations: any, optErrorCallback: any) => {
    const shaders = [];
    for (let ii = 0; ii < shaderSources.length; ++ii) {
        const shaderType = defaultShaderType[ii];
        shaders.push(loadShader(gl, shaderSources[ii], gl[shaderType], optErrorCallback));
    }
    return createProgram(gl, shaders, optAttribs, optLocations, optErrorCallback);
};

export const setupWebglContext = (canvas: Selection<BaseType, any, HTMLElement, any>) => {
    const webglOption = {
        alpha: true, // 캔버스에 알파 버퍼가 포함되어 있는지 를 나타내는 부울입니다.
        antialias: true, // 항별칭을 수행할지 여부를 나타내는 부울
        // preserveDrawingBuffer: true, // 값이 true인 경우 버퍼가 지워지지 않으며 작성자가 지우거나 덮어쓸 때까지 해당 값을 보존합니다.
        powerPreference: 'high-performance',
        // depth: false, // 도면 버퍼에 최소 16비트의 깊이 버퍼가 있음을 나타내는 부울입니다.
        // /**
        //  * 웹GL 컨텍스트에 적합한 GPU 구성을 나타내는 사용자 에이전트에 대한 힌트입니다. 가능한 값은 다음과 같습니다.
        // 'default': 사용자 에이전트가 가장 적합한 GPU 구성을 결정하도록 합니다. 기본 값입니다.
        // 'high-performance': 전력 소비보다 렌더링 성능의 우선 순위를 지정합니다.
        // 'low-power': 렌더링 성능보다 절전의 우선 순위를 지정합니다.
        //  */
        premultipliedAlpha: true, // 페이지 작성자가 드로잉 버퍼에 미리 곱한 알파가 있는 색상이 포함되어 있다고 가정한다는 것을 나타내는 부울입니다.
        stencil: true, // 도면 버퍼에 최소 8비트의 스텐실 버퍼가 있음을 나타내는 부울입니다.
        // desynchronized: true, // 이벤트 루프에서 캔버스 페인트 주기의 비동기화를 해제하여 사용자 에이전트가 대기 시간을 줄이도록 힌트하는 부울
        failIfMajorPerformanceCaveat: true // 시스템 성능이 낮거나 하드웨어 GPU를 사용할 수 없는 경우 컨텍스트가 생성될지 를 나타내는 부울수입니다.
    };
    return (canvas.node() as any).getContext('webgl', webglOption) ?? (canvas.node() as any).getContext('experimental-webgl', webglOption);
};

const createShaderFromScript = (gl: any, scriptId: string, optShaderType: string, optErrorCallback: any) => {
    let shaderSource = '';
    let shaderType;
    const shaderScript: any = document.getElementById(scriptId);

    if (!shaderScript) {
        throw new Error('*** Error: unknown script element' + scriptId);
    }
    shaderSource = shaderScript.text;

    if (!optShaderType) {
        if (shaderScript.type === 'x-shader/x-vertex') {
            shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type === 'x-shader/x-fragment') {
            shaderType = gl.FRAGMENT_SHADER;
        } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
            throw new Error('*** Error: unknown shader type');
        }
    }

    return loadShader(gl, shaderSource, optShaderType ? optShaderType : shaderType, optErrorCallback);
};

const loadShader = (gl: any, shaderSource: any, shaderType: any, optErrorCallback: any) => {
    const errFn = optErrorCallback ?? error;
    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        // Something went wrong during compilation; get the error
        const lastError = gl.getShaderInfoLog(shader);
        errFn('*** Error compiling shader ' + shader + ':' + lastError);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

const createProgram = (gl: any, shaders: string[], optAttribs: any, optLocations: any, optErrorCallback: any) => {
    const errFn = optErrorCallback ?? error;
    const program = gl.createProgram();
    shaders.forEach((shader: string) => {
        gl.attachShader(program, shader);
    });

    if (optAttribs) {
        optAttribs.forEach((attrib: any, ndx: number) => {
            gl.bindAttribLocation(program, optLocations ? optLocations[ndx] : ndx, attrib);
        });
    }
    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        const lastError = gl.getProgramInfoLog(program);
        errFn('Error in program linking:' + lastError);

        gl.deleteProgram(program);
        return null;
    }
    return program;
};

const error = (msg: any) => {
    if (console && console.log) {
        console.log('error : ', msg);
    }
};
