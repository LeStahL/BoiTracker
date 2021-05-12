//! INPUT 2:0

// Constants
const float timeDelta = 1.1;
const vec2 midiResolution = vec2(128.,80.);
const vec3 c = vec3(1.,0.,-1.);

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
    if(d > 0.) return d+.1*height;

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
}

// Ui cell for one pitch block
UiInformation cell(vec2 x, vec2 size, float pitch) {
    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0. && xj.x >= 0. && xj.x < 4.) {
        return ui(abs(dGlyph(dx, pitchToNoteText(pitch)[int(xj.x)], 1.5*size.y))-.0005, 3.);
    }
    return ui(1., 0.);
}

// Ui matrix for tracker information
UiInformation tracker(vec2 x, vec2 cellSize) {
    vec2 dx = mod(x, cellSize) - .5*cellSize,
        xj = ceil((x-dx)/cellSize);
    if(xj.x > 0. && xj.y <= 16. && xj.y >= 0.) {
        return cell(dx, .5*cellSize*vec2(.25,1.), texelFetch(iChannel0, ivec2(xj), 0).x);
    }
}

// Retrieve text from dictionary. Will not check if the index is actually contained in the
// dictionary.
UiInformation text(int index) {
    return ui(0.,0.);
}

UiInformation window(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R;

    return tracker(x+vec2(iResolution.x/iResolution.y,.25), .2*vec2(1., .2));

    return add(
        add(
            // Window background
            ui(d, 1.),
            // Window title bar
            ui(abs(dLine(x,(outerSize-R)*c.zx, (outerSize-R)))-R, 2.)
        ),
        add(
            // Border
            ui(abs(d)-.002, 2.),
            // Title text
            // ui(abs(dGlyph(x, 7., .2))-.01, 3.)
            // cell(x, .2*vec2(.2, .15), texelFetch(iChannel0, ivec2(1.+0.), 0).x)
            tracker(x, .2*vec2(.8, .15))
        )
    );
}

UiInformation background(vec2 x) {
    return ui(0.,0.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy-.5*iResolution.xy)/iResolution.y;

    UiInformation ui = add(
        background(uv),
        window(uv, vec2(.4,.3), .02)
    );

    fragColor = vec4(clamp(ui.color,0.,1.),1.0);
    // fragColor = texture(iChannel0, fragCoord.xy/iResolution.xy);
}
