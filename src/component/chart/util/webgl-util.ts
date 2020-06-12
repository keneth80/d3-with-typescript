const defaultShaderType = [
    'VERTEX_SHADER',
    'FRAGMENT_SHADER',
];

export const hexToRgb = (hex: any) =>
hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m: number, r: number, g: number, b: number) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map((x: string) => parseInt(x, 16));

export const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b]
    .map(x => x.toString(16).padStart(2, '0')).join('');

export const createProgramFromScripts = (gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) => {
    const shaders = [];
    for (let ii = 0; ii < shaderScriptIds.length; ++ii) {
        shaders.push(
            createShaderFromScript(gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback)
        );
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

export const createProgramFromSources = (gl: any, shaderSources: Array<string>, opt_attribs: any, opt_locations: any, opt_errorCallback: any) => {
    const shaders = [];
    for (let ii = 0; ii < shaderSources.length; ++ii) {
        const shaderType = defaultShaderType[ii];
        shaders.push(
            loadShader(gl, shaderSources[ii], gl[shaderType], opt_errorCallback)
        );
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

const createShaderFromScript = (gl: any, scriptId: string, opt_shaderType: string, opt_errorCallback: any) => {
    let shaderSource = '';
    let shaderType;
    const shaderScript: any = document.getElementById(scriptId);

    if (!shaderScript) {
        throw ('*** Error: unknown script element' + scriptId);
    }
    shaderSource = shaderScript.text;

    if (!opt_shaderType) {
        if (shaderScript.type === 'x-shader/x-vertex') {
            shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type === 'x-shader/x-fragment') {
            shaderType = gl.FRAGMENT_SHADER;
        } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
            throw ('*** Error: unknown shader type');
        }
    }

    return loadShader(
        gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
        opt_errorCallback
    );
}

const loadShader = (gl: any, shaderSource: any, shaderType: any, opt_errorCallback: any) => {
    const errFn = opt_errorCallback || error;
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
}

const createProgram = (gl: any, shaders: Array<string>, opt_attribs: any, opt_locations: any, opt_errorCallback: any) => {
    const errFn = opt_errorCallback || error;
    const program = gl.createProgram();
    shaders.forEach((shader: string) => {
        gl.attachShader(program, shader);
    });

    if (opt_attribs) {
        opt_attribs.forEach((attrib: any, ndx: number) => {
        gl.bindAttribLocation(
            program,
            opt_locations ? opt_locations[ndx] : ndx,
            attrib);
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
}

const error = (msg: any) => {
    if (console && console.log) {
        console.log('error : ', msg);
    }    
}