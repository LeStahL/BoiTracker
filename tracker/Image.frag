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

float dMercury(vec2 x)
{
    x += .1*c.yx;
    return 
    min(
        max(
            dBox(x-.35*c.yx,vec2(.4,.35)),
            -min(
                dBox(x-.7*c.yx, vec2(.2,.2)),
                dBox(x-.25*c.yx,vec2(.2,.05))
            )
        ), 
        min(
            dBox(x+.2*c.yx,vec2(.1,.4)),
            dBox(x+.2*c.yx, vec2(.4,.1))
        )
    );
}

float m(vec2 x)
{
    return max(x.x,x.y);
}

float dTeam210(vec2 x)
{
    return min(max(max(max(max(min(max(max(m(abs(vec2(abs(abs(x.x)-.25)-.25, x.y))-vec2(.2)), -m(abs(vec2(x.x+.5, abs(abs(x.y)-.05)-.05))-vec2(.12,.02))), -m(abs(vec2(abs(x.x+.5)-.1, x.y-.05*sign(x.x+.5)))-vec2(.02,.07))), m(abs(vec2(x.x+.5,x.y+.1))-vec2(.08,.04))), -m(abs(vec2(x.x, x.y-.04))-vec2(.02, .08))), -m(abs(vec2(x.x, x.y+.1))-vec2(.02))), -m(abs(vec2(x.x-.5, x.y))-vec2(.08,.12))), -m(abs(vec2(x.x-.5, x.y-.05))-vec2(.12, .07))), m(abs(vec2(x.x-.5, x.y))-vec2(.02, .08)));
}

float dAlcatraz(vec2 uv)
{
    vec2 a = abs(uv)-.25;
    return max(max(min(max(min(abs(mod(uv.x-1./12.,1./6.)-1./12.)-1./30., abs(a.x+a.y)-.015),a.x+a.y), max(a.x+.1,a.y+.1)), -length(uv-vec2(0.,.04))+.045), -max(a.x+.225,a.y+.175));
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
        return vec3(0.00,0.02,0.03);
    } else if(material == 1.) {
        return vec3(0.34,0.66,0.66); // desktop background color
    } else if(material == 2.) {
        return vec3(0.75,0.78,0.79); // normal window background color
    } else if(material == 3.) {
        return vec3(0.34,0.34,0.35); // separator dark
    } else if(material == 4.) {
        return vec3(0.89,0.90,0.91); // separator light
    } else if(material == 5.) {
        return vec3(0.87,0.88,0.38); // folder yellow
    } else if(material == 6.) {
        return vec3(0.16,0.00,0.65); // ugly title bar
    } else if(material == 7.) {
        return vec3(1.00,0.33,0.00); // mercury orange
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

UiInformation desktop(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R,
        a = iResolution.x/iResolution.y,
        taskBarBody = dBox(x+.4775*c.yx, vec2(.5*a, .02)), 
        startBody = dBox(x+.4725*c.yx+.48*a*c.xy, vec2(.03,.014)),
        startBodyShadow = dBox(x+.4725*c.yx+.48*a*c.xy-.0035*c.xz, vec2(.03,.012));

    vec2 trackerSize = vec2(.4*a, .48)+.008;
    float trackerBounds = dBox(x, trackerSize),
        trackerShadow = dBox(x+.0025*c.xz, trackerSize),
        windowTitleBar = dBox(x-.468*c.yx, vec2(.4*a, .014)),
        mercuryBox = dBox(x-.45*vec2(a,1.)*c.zx, vec2(.035,.035));

    return 
    add(
        add(
            add(
                // Task bar body
                ui(taskBarBody, 2.),
                // Task bar highlights
                ui(abs(taskBarBody)-.002, 4.)
            ),
            add(
                add(
                    // Tracker window body
                    ui(trackerBounds, 2.),
                    // Title bar
                    ui(windowTitleBar, 6.)
                ),
                add(
                    // Tracker window shadow
                    ui(abs(trackerShadow)-.002, 3.),
                    // Tracker window highlights
                    ui(abs(trackerBounds)-.002, 4.)
                )
            )
        ),
        add(
            add(
                // Task bar shadow
                ui(abs(dLine(x+.499*c.yx, -.5*a*c.xy, .5*a*c.xy))-.005, 3.),
                add(
                    // Mercury logo background
                    ui(mercuryBox, 7.),
                    // Mercury logo outline
                    ui(min(abs(mercuryBox)-.005, dMercury((x-.45*vec2(a,1.)*c.zx)/vec2(.035,.035))), 0.)
                )
            ),
            add(
                add(
                    // Start button shadow
                    ui(abs(startBodyShadow)-.004, 3.),
                    // Start button body
                    ui(startBody, 2.)
                ),
                // Start button highlights
                ui(abs(startBody)-.002, 4.)
            )
        )
    );
}

UiInformation background(vec2 x) {
    return ui(-1.,1.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy-.5*iResolution.xy)/iResolution.y;
    float a = iResolution.x/iResolution.y;

    UiInformation ui = add(
        background(uv),
        desktop(uv, vec2(.4,.3), .02)
    );

    vec3 col = clamp(ui.color,0.,1.);

    vec2 trackerSize = vec2(.4*a, .45);
    float trackerBounds = dBox(uv, trackerSize);
    if(trackerBounds < 0.) {
        col = texture(iChannel0, (fragCoord.xy/iResolution.xy-vec2(.05*a, .025))*vec2(1.225,1.05)).rgb;
    }

    // col = mix(col, c.xyy, sm(dmercury(2.*uv)));
    
    fragColor = vec4(clamp(col,0.,1.),1.0);
}
