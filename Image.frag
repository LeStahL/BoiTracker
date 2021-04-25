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
    if(b.dist<1.5/iResolution.y) {
        a.color = renderOnto(a.color, b);
    }

    if(b.dist<0.) {
        a.dist = b.dist;
        a.material = b.material;
    }
    
    return a;
}

UiInformation ui(float dist, float material) {
    return UiInformation(dist, material, materialColor(material));
}

UiInformation window(vec2 x, vec2 outerSize, float R) {
    float d = dBox(x, outerSize-R)-R;
    // return add(ui(abs(d)-.002, 2.),ui(d, 1.));
    return add(
        add(
            // Window background
            ui(d, 1.),
            // Window title bar
            ui(abs(dLine(x,(outerSize-R)*c.zx, (outerSize-R)))-R,3.)
        ),
        // Border
        ui(abs(d)-.002, 2.)
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
}
