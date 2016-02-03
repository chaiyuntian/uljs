/**
 * Created by UnrealLight on 2016/1/28 0028.
 */
// Unreal Light 上海虚幻之光数字科技有限公司
ul = {
    version: 0.1,
    author: "Yuntian Chai",
    company: "Unreal Light",
    companyfullname: "上海虚幻之光数字科技有限公司"
};
ul.DEBUG = true;
// UnrealLight Waning and messages
ul.log = function() {
    if (ul.DEBUG) {
        console.log.apply(console, arguments);
    }
};
ul.error = function() {
    if (true) {
        console.error.apply(console, arguments);
    }
};
ul.warn = function() {
    if (ul.DEBUG) {
        console.warn.apply(console, arguments);
    }
};
// Animation Frame Request
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
//Shader
ul.SHADER_TYPE = {
    FRAG: 1,
    VERT: 2
};

ul.PANO_VS = "attribute vec3 position;uniform mat4 modelMatrix;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec3 vWorldPosition;void main() {vWorldPosition =  normalize( ( modelMatrix * vec4( position, 0.0 ) ).xyz );gl_Position = projectionMatrix * modelViewMatrix * vec4( position,1.0);}";
ul.PANO_FS = "precision highp float;\nuniform sampler2D texture0;uniform float tFlip;varying vec3 vWorldPosition;\n#define saturate(a) clamp( a, 0.0, 1.0)\n#define RECIPROCAL_PI2 0.15915494\nvoid main(){vec3 direction = normalize( vWorldPosition );vec2 uv;uv.y = saturate(tFlip*direction.y*-0.5+0.5);uv.x = atan(direction.z,direction.x ) * RECIPROCAL_PI2 + 0.5;gl_FragColor = texture2D( texture0,uv );}"; //vec4(0.5,0.5,1.0,1.0)


// Web Gl Shander
ul.shader = function(gl, type, string, params) {
    var shader;
    ul.log("start compiling shader!");
    if (type == ul.SHADER_TYPE.FRAG) {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == ul.SHADER_TYPE.VERT) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        ul.error("shader type should be either ul.SHADER_TYPE.FRAG or ul.SHADER_TYPE.VERT");
        return null;
    }
    gl.shaderSource(shader, string);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
        ul.error("Shader compiler failure!");
        return null;
    }
    var info = gl.getShaderInfoLog(shader);
    if (info !== '') {
        ul.warn('gl.getshaderInfoLog()', info);
    }
    ul.log("Shader compile finished.");
    return shader;
};
// Shader Program
ul.program = function(gl, params) {
    var vs = ul.shader(gl, ul.SHADER_TYPE.VERT, params.vert);
    var fs = ul.shader(gl, ul.SHADER_TYPE.FRAG, params.frag);
    var prg = gl.createProgram();
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);

    //gl.bindAttribLocation(prg, 0, "position");
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        ul.error("Could not initialize shaders");
    }

    // Get Attributes
    prg.attributes = {};
    for (var i = 0; i < params.attributes.length; i++) {
        var attributeName = params.attributes[i];
        prg.attributes[attributeName] = gl.getAttribLocation(prg, attributeName);
        gl.enableVertexAttribArray(prg.attributes[attributeName]);
    }
    // Get Uniforms
    prg.uniforms = {};
    for (i = 0; i < params.uniforms.length; i++) {
        var uniformName = params.uniforms[i];
        prg.uniforms[uniformName] = gl.getUniformLocation(prg, uniformName);
        //gl.enableVertexAttribArray(this.attributes[uniformName]);
    }

    gl.useProgram(prg);

    return prg;
};
//file cache for loaded files
ul.cache = {
    enabled: false,
    files: {},
    add: function(key, file) {
        if (this.enabled === false) return;
        this.files[key] = file;
    },
    get: function(key) {
        if (this.enabled === false) return;
        return this.files[key];
    },
    remove: function(key) {
        delete this.files[key];
    },
    clear: function() {
        this.files = {};
    }
};

ul.TEXTURE_TYPE = {VIDEO:1,IMAGE:0};

//Texture creation
ul.texture = function(gl, url) {
    var texture = gl.createTexture();
    texture.loaded = false;
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        ul.log("Image Loaded!");
        texture.loaded = true;
    };

    texture.startUpdate = function() {
        image.src = url;
    };

    return texture;
};

ul.videoTexture = function(gl, videoID) {
    var video = document.getElementById(videoID);
    var texture = gl.createTexture();
    texture.loaded = false;

    var videoDataReady = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        //texture.loaded = true;
    };

    function update() {
        window.requestAnimFrame(update);
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            videoDataReady();
        }
    };
    //update();
    texture.startUpdate = function() {
        texture.loaded = true;
        video.play();
        update();
    };
    texture.update = update;

    return texture;
};

//BufferAttribute
ul.BufferAttribute = function(arr, itemSize) {
    this.array = arr;
    this.itemSize = itemSize;
};
ul.BufferAttribute.prototype = {
    constructor: ul.BufferAttribute,
    get count() {
        return this.array.length / this.itemSize;
    },
    setV2: function(index, x, y) {
        index *= this.itemSize;
        this.array[index + 0] = x;
        this.array[index + 1] = y;
        return this;
    },
    setV3: function(index, x, y, z) {
        index *= this.itemSize;
        this.array[index + 0] = x;
        this.array[index + 1] = y;
        this.array[index + 2] = z;
        return this;
    }
};
ul.Float32Attribute = function(array, itemSize) {
    return new ul.BufferAttribute(new Float32Array(array), itemSize);
};
ul.Uint8Attribute = function(array, itemSize) {
    return new ul.BufferAttribute(new Uint8Array(array), itemSize);
};
//Geometry
ul.Sphere = function(radius, widthSegments, heightSegments) {
    var Sphere = {};
    radius = radius || 50;

    widthSegments = Math.max(3, Math.floor(widthSegments) || 8);
    heightSegments = Math.max(2, Math.floor(heightSegments) || 6);

    var phiStart = 0;
    var phiLength = Math.PI * 2;
    var thetaStart = 0;
    var thetaLength = Math.PI;
    var thetaEnd = Math.PI;

    var vertexCount = ((widthSegments + 1) * (heightSegments + 1));
    var positions = new ul.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    //var normals = new THREE.BufferAttribute( new Float32Array( vertexCount * 3 ), 3 );
    var uvs = new ul.BufferAttribute(new Float32Array(vertexCount * 2), 2);

    var index = 0,
        vertices = []; //, normal = new THREE.Vector3();

    for (var y = 0; y <= heightSegments; y++) {
        var verticesRow = [];
        var v = y / heightSegments;
        for (var x = 0; x <= widthSegments; x++) {
            var u = x / widthSegments;
            var px = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            var py = radius * Math.cos(thetaStart + v * thetaLength);
            var pz = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            //normal.set( px, py, pz ).normalize();
            positions.setV3(index, px, py, pz);
            //normals.setXYZ( index, normal.x, normal.y, normal.z );
            uvs.setV2(index, u, 1 - v);
            verticesRow.push(index);
            index++;

        }
        vertices.push(verticesRow);
    }

    var indices = [];
    for (var y = 0; y < heightSegments; y++) {

        for (var x = 0; x < widthSegments; x++) {

            var v1 = vertices[y][x + 1];
            var v2 = vertices[y][x];
            var v3 = vertices[y + 1][x];
            var v4 = vertices[y + 1][x + 1];
            if (y !== 0 || thetaStart > 0) indices.push(v1, v2, v4);
            if (y !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(v2, v3, v4);
        }

    }

    Sphere.uvs = uvs;
    Sphere.indices = new Uint16Array(indices); //ul.Uint8Attribute(indices,3);
    Sphere.positions = positions;
    return Sphere;
};
//GL Utils
function getGLContext(canvas) {
    var gl = null;
    if (canvas == null) {
        ul.error("there is no canvas on this page");
        return;
    }
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < names.length; ++i) {
        try {
            gl = canvas.getContext(names[i], {
                antialias: false
            });
        } catch (e) {}
        if (gl) break;
    }
    if (gl == null) {
        ul.error("WebGL is not available");
    } else {
        ul.log("You got a WebGL context!!!");
    }
    return gl;
}
//Math
var d2r_coef = Math.PI / 180;
ul.math = {
    d2r: function(d) {
        return d * d2r_coef;
    },
    clampf: function(v, min, max) {
        if (v < min) {
            return min;
        }
        if (v > max) {
            return max;
        }
        return v;
    }
};
//Axis
ul.axis = {
    X: [1, 0, 0],
    Y: [0, 1, 0],
    Z: [0, 0, 1]
};
//Camera
ul.camera = function(fov, n, f, a) {
    this.fov = fov;
    this.near = n;
    this.far = f;
    this.aspect = a;
    this.projMatrix = mat4.create();
    this.updateProjMatrix();
};
ul.camera.prototype.updateProjMatrix = function() {
    mat4.perspective(this.projMatrix, ul.math.d2r(this.fov), this.aspect, this.near, this.far);
};

ul.MOBILE = {};
ul.MOBILE.ORIENTATION = {HORI:0,VERT:1};

ul.renderer = function(type,url) {
    var _canvas = document.createElement("canvas");
    //_canvas.width = window.innerWidth;
    //_canvas.height= window.innerHeight;
    var _width = _canvas.width;
    var _height = _canvas.height;

    var _gl = getGLContext(_canvas);
    this.canvas = _canvas;
    var pixelRatio = 1;

    var _viewportX = 0;
    var _viewportY = 0;

    var _viewportWidth = _canvas.width;
    var _viewportHeight = _canvas.height;

    var _orientation = ul.MOBILE.ORIENTATION.HORI;
    this.SetOrientation = function (v) {
        _orientation = v;
    };

    if ("onorientationchange" in window)
    {
        if (window.orientation == 180 || window.orientation == 0) {
            this.SetOrientation(ul.MOBILE.ORIENTATION.VERT);
        }
        if (window.orientation == 90 || window.orientation == -90) {
            this.SetOrientation(ul.MOBILE.ORIENTATION.HORI);
        }
    }




    var _program = ul.program(_gl, {
        vert: ul.PANO_VS,
        frag: ul.PANO_FS,
        attributes: ["position"],
        uniforms: ["modelMatrix", "modelViewMatrix", "projectionMatrix", "texture0", "tFlip"]
    });

    this.program = _program;

    var _skySphere = ul.Sphere(100.0, 25, 10);
    var _skyTexture = null;
    if (type == ul.TEXTURE_TYPE.IMAGE) {
        _skyTexture = ul.texture(_gl, url);// texture buffer
    }
    else {
        _skyTexture = ul.videoTexture(_gl, url); // texture buffer
    }
    //var

    var _tFlip = -1.0; // whether flip texture or not

    var _sphereVertexBuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ARRAY_BUFFER, _sphereVertexBuffer);
    _gl.bufferData(_gl.ARRAY_BUFFER, _skySphere.positions.array, _gl.STATIC_DRAW);

    var _sphereIndexBuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _sphereIndexBuffer);
    _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, _skySphere.indices, _gl.STATIC_DRAW); /////////////////////////////////////////////////////////////////////////////////////////

    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);

    var _camera = new ul.camera(45, 0.1, 10000.0, _canvas.width / _canvas.height); //
    _camera.updateProjMatrix();
    this.camera = _camera;

    var mMatrix = mat4.create(); // The Model matrix
    var mvMatrix = mat4.create(); // The Model-View matrix
    this.modelViewMatrix = mvMatrix;


    mat4.identity(mMatrix);

    this.setPixelRatio = function (value) {
        if (value !== undefined) pixelRatio = value;
    };

    this.getSize = function () {
        return {
            width: _width,
            height: _height
        };
    };

    var setViewport = function (x, y, width, height) {
        _viewportX = x * pixelRatio;
        _viewportY = y * pixelRatio;
        _viewportWidth = width * pixelRatio;
        _viewportHeight = height * pixelRatio;
        _gl.viewport(_viewportX, _viewportY, _viewportWidth, _viewportHeight); // _viewportWidth, _viewportHeight
    };

    this.setViewport = setViewport;

    var SetSizeUtil = function (width, height, updateStyle, scrnAspect) {
        _width = width;
        _height = height;

        _canvas.width = width * pixelRatio;
        _canvas.height = height * pixelRatio;

        if (updateStyle !== false) {
            _canvas.style.width = width + 'px';
            _canvas.style.height = height + 'px';

        }
        _camera.aspect = width / height * scrnAspect;
        _camera.updateProjMatrix();
        setViewport(0, 0, width, height);
    };

    this.setSize = function (width, height, updateStyle) {

        if (_orientation == ul.MOBILE.ORIENTATION.HORI) {
            SetSizeUtil(width, height, updateStyle, window.screen.width / window.screen.height);
        }
        if (_orientation == ul.MOBILE.ORIENTATION.VERT) {
            SetSizeUtil(width,height , updateStyle, window.screen.height / window.screen.width);
        }


    };

    this.clear = function () {
        _gl.clearColor(0.0, 0.0, 0.0, 1.0);
    };

    this.renderScene = function () {

        _gl.clearColor(0.0, 0.0, 0.0, 1.0);
        _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
        _gl.enableVertexAttribArray(_program.attributes.position);

        // update the properties anb make new;
        _gl.uniformMatrix4fv(_program.uniforms.modelMatrix, false, mMatrix);
        _gl.uniformMatrix4fv(_program.uniforms.modelViewMatrix, false, mvMatrix);
        _gl.uniformMatrix4fv(_program.uniforms.projectionMatrix, false, _camera.projMatrix);
        _gl.uniform1f(_program.uniforms.tFlip, _tFlip);

        if (_skyTexture.loaded) {
            _gl.activeTexture(_gl.TEXTURE0);
            _gl.bindTexture(_gl.TEXTURE_2D, _skyTexture);
            _gl.uniform1i(_program.uniforms.texture0, 0);
        }

        _gl.bindBuffer(_gl.ARRAY_BUFFER, _sphereVertexBuffer);
        _gl.vertexAttribPointer(_program.attributes.position, 3, _gl.FLOAT, false, 0, 0);
        _gl.enableVertexAttribArray(_program.attributes.position);
        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _sphereIndexBuffer);

        _gl.drawElements(_gl.TRIANGLES, _skySphere.indices.length, _gl.UNSIGNED_SHORT, 0); //
        _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);
    };

    _skyTexture.startUpdate();


};


ul.mouseController = function(renderer) {

    var _camera = renderer.camera;
    var _renderer = renderer;
    var _mouseDown = false;
    var _mouseDownX = 0;
    var _mouseDownY = 0;
    var _lon = 0,
        _mouseDownLon = 0;
    var _lat = 90,
        _mouseDownLat = 0;
    var _lat_clamped = 0;
    var _phi = 0,
        _theta = 0;
    var _matRotation = mat4.create();

    var handleMouseDown = function (event) {
        event.preventDefault();
        _mouseDown = true;
        _mouseDownX = event.clientX;
        _mouseDownY = event.clientY;
        _mouseDownLon = _lon;
        _mouseDownLat = _lat;
    };

    var handleMouseUp = function (event) {
        _mouseDown = false;
    };

    var handleMouseMove = function (event) {
        if (_mouseDown) {
            _lon = (_mouseDownX - event.clientX) * 0.1 + _mouseDownLon;
            _lat = (event.clientY - _mouseDownY) * 0.1 + _mouseDownLat;
            _lat_clamped = Math.max(-85, Math.min(85, _lat));
            _phi = ul.math.d2r(90 - _lat);
            _theta = ul.math.d2r(_lon);
            mat4.identity(_matRotation);
            mat4.rotate(_matRotation, _matRotation, _phi, ul.axis.X);
            mat4.rotate(renderer.modelViewMatrix, _matRotation, _theta, ul.axis.Y);
        }
    };

    var autoUpdate = function () {
        if (_mouseDown == false) {
            _lon = _lon + 0.08;
            _phi = ul.math.d2r(90 - _lat);
            _theta = ul.math.d2r(_lon);
            mat4.identity(_matRotation);
            mat4.rotate(_matRotation, _matRotation, _phi, ul.axis.X);
            mat4.rotate(renderer.modelViewMatrix, _matRotation, _theta, ul.axis.Y);
        }

    };
    this.autoUpdate = autoUpdate;

    var handleMouseWheel = function (event) {
        // WebKit
        if (event.wheelDeltaY) {
            _camera.fov -= event.wheelDeltaY * 0.05;
            // Opera / Explorer 9
        } else if (event.wheelDelta) {
            _camera.fov -= event.wheelDelta * 0.05;
            // Firefox
        } else if (event.detail) {
            _camera.fov += event.detail * 1.0;
        }
        _camera.fov = ul.math.clampf(_camera.fov, 10.0, 120.0);
        _camera.updateProjMatrix();
    };

    var handleWindowResize = function (event) {

        renderer.setSize(window.innerWidth, window.innerHeight, true);
        renderer.renderScene();
        ul.log("resized");
    };

    var handleMobileOrientationChange = function ()
    {

        if(window.orientation==180||window.orientation==0){
            renderer.SetOrientation(ul.MOBILE.ORIENTATION.VERT);
        }
        if(window.orientation==90||window.orientation==-90){
            renderer.SetOrientation(ul.MOBILE.ORIENTATION.HORI);
        }

        renderer.setSize(window.innerWidth, window.innerHeight, true);
        renderer.renderScene();
    };

    function handleTouchStart(event){
        try {
            event.preventDefault();
            var touch = event.touches[0];
            var x = Number(touch.pageX);
            var y = Number(touch.pageY);
            _mouseDown = true;
            _mouseDownX = x;
            _mouseDownY = y;
            _mouseDownLon = _lon;
            _mouseDownLat = _lat;
        } catch (e) {
        }
    }

    function handleTouchMove(event) {
        try {
            event.preventDefault();
            if (_mouseDown) {
                var touch = event.touches[0];
                var x = Number(touch.pageX);
                var y = Number(touch.pageY);
                _lon = (_mouseDownX - x) * 0.1 + _mouseDownLon;
                _lat = (y - _mouseDownY) * 0.1 + _mouseDownLat;
                _lat_clamped = Math.max(-85, Math.min(85, _lat));
                _phi = ul.math.d2r(90 - _lat);
                _theta = ul.math.d2r(_lon);
                mat4.identity(_matRotation);
                mat4.rotate(_matRotation, _matRotation, _phi, ul.axis.X);
                mat4.rotate(renderer.modelViewMatrix, _matRotation, _theta, ul.axis.Y);
            }
        } catch (e) {}
    }

    function handleTouchEnd(event) {
        try {
            event.preventDefault();
            _mouseDown = false;
        } catch (e) {}
    }


    function bindTouchEvent() {
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchmove', handleTouchMove, false);
        document.addEventListener('touchend', handleTouchEnd, false);
    }

    function UnbindTouchEvent() {
        document.removeEventListener('touchstart', handleTouchStart, false);
        document.removeEventListener('touchmove', handleTouchMove, false);
        document.removeEventListener('touchend', handleTouchEnd, false);
    }

    function TouchDeviceTryBind() {
        try {
            document.createEvent("TouchEvent");
            bindTouchEvent();
        } catch (e) {
        }
    }

    function TouchDeviceTryUnbind() {
        try {
            document.createEvent("TouchEvent");
            UnbindTouchEvent();
        } catch (e) {
        }
    }


    var BindAllEvents = function() {
        document.addEventListener('mousedown', handleMouseDown, false);
        document.addEventListener('mousemove', handleMouseMove, false);
        document.addEventListener('mouseup', handleMouseUp, false);
        document.addEventListener('mousewheel', handleMouseWheel, false);
        document.addEventListener('MozMousePixelScroll', handleMouseWheel, false);

        if("onorientationchange" in window)
        {
            window.addEventListener("orientationchange",handleMobileOrientationChange);
        }
        else
        {
            window.addEventListener('resize', handleWindowResize, false);
        }

        TouchDeviceTryBind();
    };

    var UnBindAllEvents = function() {
        document.removeEventListener('mousedown', handleMouseDown, false);
        document.removeEventListener('mousemove', handleMouseMove, false);
        document.removeEventListener('mouseup', handleMouseUp, false);
        document.removeEventListener('mousewheel', handleMouseWheel, false);
        document.removeEventListener('MozMousePixelScroll', handleMouseWheel, false);

        if("onorientationchange" in window)
        {
            window.removeEventListener("orientationchange",handleMobileOrientationChange);
        }
        else
        {
            window.removeEventListener('resize', handleWindowResize, false);
        }

        TouchDeviceTryUnbind();
    };



    this.BindEvents = BindAllEvents;
    this.UnBindEvents = UnBindAllEvents;
    //Bind Events at Creation
    BindAllEvents();
};
