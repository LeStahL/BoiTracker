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
    } else if(material == 8.) {
        return vec3(0.75,0.15,0.18); // team210 red
    } else if(material == 9.) {
        return vec3(1.,1.,1.); // white
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

UiInformation text1337(vec2 x) {
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[5] = float[5](
        49., 51., 58., 51., 55.
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 5.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 0.);
        }
    }
    return ui(1., 0.);
}

UiInformation textStart(vec2 x) {
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[5] = float[5](
        83., 116., 97., 114., 116.
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 5.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 0.);
        }
    }
    return ui(1., 0.);
}

UiInformation textBoiTracker(vec2 x) {
    // BoiTracker Extreme v1.0
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[23] = float[23](
        66., 111., 105., 84., 114., 97., 99., 107., 101., 114., 32., 69., 120., 116., 114., 101., 109., 101., 32., 118., 49., 46., 48.
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 23.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 9.);
        }
    }
    return ui(1., 0.);
}

UiInformation textMercury(vec2 x) {
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[7] = float[7](
        77, 101, 114, 99, 117, 114, 121
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 7.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 0.);
        }
    }
    return ui(1., 0.);
}

UiInformation textAlcatraz(vec2 x) {
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[8] = float[8](
        65, 108, 99, 97, 116, 114, 97, 122
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 8.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 0.);
        }
    }
    return ui(1., 0.);
}

UiInformation textTeam210(vec2 x) {
    const vec2 size = vec2(.035*.3,1.5*.035);
    const float ordinals[7] = float[7](
        84, 101, 97, 109, 50, 49, 48
    );

    vec2 dx = mod(x, size)-.5*size,
        xj = ceil((x-dx)/size);

    if(xj.y == 0.) {
        if(xj.x >= 0. && xj.x < 7.) {
            return ui(abs(dGlyph(dx, ordinals[int(xj.x)], .5*size.y))-.003, 0.);
        }
    }
    return ui(1., 0.);
}

UiInformation desktop(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R,
        a = iResolution.x/iResolution.y,
        taskBarBody = dBox(x+.4775*c.yx, vec2(.5*a, .02)), 
        startBody = dBox(x+.4725*c.yx+.48*a*c.xy, vec2(.035,.014)),
        startBodyShadow = dBox(x+.4725*c.yx+.48*a*c.xy-.0035*c.xz, vec2(.035,.012));

    vec2 trackerSize = vec2(.4*a, .48)+.008;
    float trackerBounds = dBox(x, trackerSize),
        trackerShadow = dBox(x+.0025*c.xz, trackerSize),
        windowTitleBar = dBox(x-.468*c.yx, vec2(.4*a, .014)),
        mercuryBox = dBox(x-.45*vec2(a,1.)*c.zx, vec2(.032,.032)),
        xBox = dBox(x-.468*c.xx-.23*c.xy, vec2(.013)),
        xBoxShadow = dBox(x-.468*c.xx+.0023*c.xz-.23*c.xy, vec2(.013));

    return 
    add(
        add(
            add(
                // Task bar body
                ui(taskBarBody, 2.),
                add(
                    // Task bar highlights
                    ui(abs(taskBarBody)-.002, 4.),
                    // Team210 logo
                    ui(dTeam210((x-.45*vec2(a,1.)*c.zx+.24*c.yx)/1.6/vec2(.035,.035)), 8.)
                )
            ),
            add(
                add(
                    // Tracker window body
                    ui(trackerBounds, 2.),
                    // Title bar
                    ui(windowTitleBar, 6.)
                ),
                add(
                    add(
                        // Tracker window shadow
                        ui(abs(trackerShadow)-.002, 3.),
                        // Tracker window highlights
                        ui(abs(trackerBounds)-.002, 4.)
                    ),
                    add(
                        add(
                            // X box shadows
                            ui(abs(xBoxShadow)-.002,3.),
                            // X box highlights
                            ui(abs(xBox)-.002, 4.)
                        ),
                        add(
                            // X box body
                            ui(xBox, 2.),
                            // X text
                            ui(abs(dGlyph(x-.468*c.xx-.23*c.xy, 120, .5*1.5*.035))-.0003, 0.)
                        )
                    )
                )
            )
        ),
        add(
            add(
                add(
                    // Task bar shadow
                    ui(abs(dLine(x+.499*c.yx, -.5*a*c.xy, .5*a*c.xy))-.005, 3.),
                    // ATZ logo
                    ui(dAlcatraz((x-.45*vec2(a,1.)*c.zx+.12*c.yx)/2.2/vec2(.035,.035))-.015, 0.)
                ),
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
                add(
                    add(
                        // Start button highlights
                        ui(abs(startBody)-.002, 4.),
                        add(
                            // Alcatraz text
                            textAlcatraz(x-vec2(-.832, .305)),
                            // Team210 text
                            textTeam210(x-vec2(-.827, .21))
                        )
                    ),
                    add(
                        add(
                            // 13:37 timer
                            text1337(x - .45*vec2(a,1.)*c.xz-.03*c.xy),
                            // Mercury text
                            textMercury(x-vec2(-.825, .425))
                        ),
                        add(
                            // Start menu text
                            textStart(x-.45*vec2(a,1.)*c.zz+.06*c.xy),
                            // BoiTracker Extreme v1.0
                            textBoiTracker(x-vec2(-.69,.495))
                        )
                    )
                )
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

    fragColor = vec4(clamp(col,0.,1.),1.0);
}
