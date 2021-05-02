//! INPUT 2:0

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

// UiInformation text(int index) {
    // return ui()
// }

UiInformation window(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R;
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
            ui(abs(dGlyph(x, 7., .2))-.01, 3.)
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
    fragColor = texture(iChannel2, fragCoord/iResolution.xy);
}
