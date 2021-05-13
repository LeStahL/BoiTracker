//! INPUT 2:0

// Constants
const vec2 midiResolution = vec2(128.,80.);
const vec3 c = vec3(1.,0.,-1.);
const float pi = 3.14159;

// Created by David Hoskins.
// See https://www.shadertoy.com/view/4djSRW
float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(in vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

struct UiInformation {
    float dist;
    float material;
    vec3 color;
};

float dBox(vec2 x, vec2 b) {
    vec2 da = abs(x)-b;
    return length(max(da,c.yy)) + min(max(da.x,da.y),0.0);
}

float dLine(vec2 x, vec2 p1, vec2 p2)
{
    vec2 d = p2-p1;
    return length(x-mix(p1, p2, clamp(dot(x-p1, d)/dot(d,d),0.,1.)));
}

float dGlyph(vec2 uv, float ordinal, float height)
{
    // Bounding box
    float d = dBox(uv, .5*height*c.xx);
    if(d > 0.) return d+.01*height;

    // Actual glyph distance
    const float nx = 16.;
    vec2 texcoord = vec2(mod(ordinal, nx), nx-1.-floor(ordinal/nx))/nx,
        wx = abs(uv/height/nx);
    if(max(wx.x,wx.y)>.5/nx) return 0.;
    return height/nx*(1.-texture(iChannel1, (texcoord + .5/nx + uv/height/nx)).r);
}

float sm(float d) {
    return smoothstep(1.5/iResolution.y, -1.5/iResolution.y, d);
}

vec3 materialColor(float material) {
    if(material == 0.) {
        return vec3(0.12,0.10,0.09);
    } else if(material == 1.) {
        return mix(vec3(0.12,0.10,0.09), vec3(0.71,0.79,0.62), .3);
    } else if(material == 2.) {
        return vec3(0.71,0.79,0.62);
    } else if(material == 3.) {
        return vec3(1.00,0.39,0.31);
    } else if(material == 4.) {
        return vec3(0.25,0.25,0.31);
    } else if(material == 5.) {
        return vec3(0.32,0.93,1.00);
    } else if(material == 6.) {
        return vec3(0.00,0.00,0.00);
    }
}

vec3 renderOnto(vec3 col, UiInformation elements) {
    return mix(col, materialColor(elements.material), sm(elements.dist));
}

UiInformation add(UiInformation a, UiInformation b) {
    if(abs(b.dist)<1.5/iResolution.y) {
        a.color = mix(a.color, b.color, sm(b.dist));
    }

    return b.dist<-1.5/iResolution.y?b:a;
}

UiInformation ui(float dist, float material) {
    return UiInformation(dist, material, materialColor(material));
}

// Lowest note shown is pitch 21, which is A0
// Convert midi pitch to note information
// Input: midi pitch
// Output: vec4 with character codes describing the note
vec4 pitchToNoteText(float pitch) {
    float note = mod(pitch-21., 12.),
        octave = 48.+(pitch-note)/12.;

    if(octave < 48.) return vec4(45.); // ----
    if(note == 0.) return vec4(65., octave, 45., 45.); // A0--
    else if(note == 1.) return vec4(65., 35., octave, 45.); // A#0-
    else if(note == 2.) return vec4(66., octave, 45., 45.); // B0--
    else if(note == 3.) return vec4(67., octave+1., 45., 45.); // C1--
    else if(note == 4.) return vec4(67., 35., octave+1., 45.); // C#1-
    else if(note == 5.) return vec4(68., octave+1, 45., 45.); // D1--
    else if(note == 6.) return vec4(68., 35., octave+1., 45.); // D#1-
    else if(note == 7.) return vec4(69., octave+1., 45., 45.); // E1--
    else if(note == 8.) return vec4(70., octave+1., 45., 45.); // F1--
    else if(note == 9.) return vec4(70., 35., octave+1., 45.); // F#1-
    else if(note == 10.) return vec4(71., octave+1., 45., 45.); // G1--
    else if(note == 1.) return vec4(71., 35., octave+1., 45.);// G#1-
    return vec4(45.);
}

// Check if a note is playing at index
bool hasNote(float channel, int index) {
    return texelFetch(iChannel0, ivec2(1+int(channel), index), 0).x != 0.;
}

// Ui cell for one pitch block
UiInformation cell(vec2 x, vec2 size, float pitch, bool current, bool hasNote) {
    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size)+3.*c.xy;

    UiInformation cellUi = ui(dBox(x, vec2(4.,1.)*size), 4.);

    if(!hasNote) {
        cellUi.color *= .5;
    }

    if(xj.y == 0. && xj.x >= 0. && xj.x < 4.) {
        cellUi =
        add(
            cellUi,
            ui(abs(dGlyph(dx, pitchToNoteText(pitch)[int(xj.x)], 1.*size.y))-.0001, current?5.:3.)
        );
    }

    return cellUi;
}

// Ui matrix for tracker information
UiInformation tracker(vec2 x, vec2 cellSize) {
    vec2 dx = mod(x, cellSize) - .5*cellSize,
        xj = ceil((x-dx)/cellSize);

    if(xj.x > 0. && xj.x <= 16. && xj.y >= 0.) {
        bool hasNote = hasNote(xj.x-1., int(xj.y));
        UiInformation cellUi = cell(dx-.5*cellSize, vec2(.9,.8)*cellSize*vec2(.25,1.), texelFetch(iChannel0, ivec2(xj), 0).x, xj.y == 0., hasNote);
        if(xj.y != 0.) {
            cellUi.color = rgb2hsv(cellUi.color);
            cellUi.color.r = .2*pi*(-1.+2.*hash12(
                xj.x+.2*c.xx
            ));

            if(hasNote) {
                cellUi.color.g = .5-.25*cellUi.color.g;
                cellUi.color.b *= 1.5;
            }

            cellUi.color = hsv2rgb(cellUi.color);

        } else {
            cellUi.color *= 2.;
            cellUi.color = -cellUi.color+1.;
        }

        return cellUi;
    }
    return ui(1.,xj.y == 0.?4.:6.);
}

// Retrieve text from dictionary. Will not check if the index is actually contained in the
// dictionary.
UiInformation text(int index) {
    return ui(0.,0.);
}

UiInformation window(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R,
        a = iResolution.x/iResolution.y;

    return tracker(x+vec2(.49*a,.45), vec2(.98*a/16., 1./32.));
}

UiInformation background(vec2 x) {
    return ui(-1.,0.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy-.5*iResolution.xy)/iResolution.y;

    UiInformation ui = add(
        background(uv),
        window(uv, vec2(.4,.3), .02)
    );

    vec3 col = clamp(ui.color,0.,1.);

    // Gamma
    col = col + col*col + col*col*col;

    fragColor = vec4(clamp(col,0.,1.),1.0);
}
