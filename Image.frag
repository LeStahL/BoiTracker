const vec3 c = vec3(1.,0.,-1.);

struct UiInformation {
    float dist;
    float material;
};

float dbox(vec2 x, vec2 b)
{
    vec2 da = abs(x)-b;
    return length(max(da,c.yy)) + min(max(da.x,da.y),0.0);
}

UiInformation add(UiInformation a, UiInformation b) {
    return a.dist < b.dist ? a : b;
}

float sm(float d)
{
    return smoothstep(1.5/iResolution.y, -1.5/iResolution.y, d);
}

UiInformation window(vec2 x, vec2 outerSize, float R) {
    float d = dbox(x, outerSize-R)-R;
    return add(
        // Background
        UiInformation(d, 1.),
        // Border
        UiInformation(abs(d)-.002, 2.)
    );
}

vec3 materialColor(float material) {
    if(material == 0.) {
        return vec3(0.12,0.10,0.09);
    } else if(material == 1.) {
        return mix(vec3(0.12,0.10,0.09), vec3(0.71,0.79,0.62), .5);
    } else if(material == 2.) {
        return vec3(0.71,0.79,0.62);
    }
}

vec3 renderOnto(vec3 col, UiInformation elements) {
    return mix(col, materialColor(elements.material), sm(elements.dist));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord.xy-.5*iResolution.xy)/iResolution.y;
    vec3 col = materialColor(0.);
    col = renderOnto(col, window(uv, vec2(.4,.3), .05));

    fragColor = vec4(clamp(col,0.,1.),1.0);
}
