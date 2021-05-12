// Texture layout:
// x axis: pixel 0: time interval index. channels 1 - 16 in pixel 1 - 16.
// y axis: time steps, in descending order (higher is newer).
// pixel content: pitch of first note in the time frame.

// Constants
const float timeDelta = 1.1,
    nEntries = 20.;
const vec2 midiResolution = vec2(128.,80.);
vec2 cellSize;
const vec3 c = vec3(1.,0.,-1.);
const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0),
    bitMask = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);

// Pack 32-bit float into pixel
vec4 float32ToRGBA(float value) {
    vec4 result = fract(value * bitShift);
    return result - result.xxyz * bitMask;
}

// Unpack 32-bit float from pixel
float RGBAToFloat32(vec4 value) {
    return dot(value, c.xxxx/bitShift);
}

// Check if current time interval is already present in the texture.
bool currentTimeIntervalIsPresent() {
    return round(mod(iTime, timeDelta)/timeDelta) == RGBAToFloat32(texture(iChannel0, c.yy));
}

// Returns the pitch of the lowest note currently playing in channel, or zero if none is playing.
float pitchOfHighestPlayingNoteOrZero(float channel) {
    float pitch = 0.;
    for(float i = 0.; i<midiResolution.x; i += 1.)
        if(RGBAToFloat32(texture(iChannel1, vec2(5*channel + 2., i)/midiResolution)) < timeDelta)
            pitch = i;
    return pitch;
}

// Add current time interval, moving everything else one line higher.
vec4 addCurrentTimeInterval(vec2 uv) {
    if(uv.y > 0.) return texture(iChannel0, (uv - c.yx)/cellSize);
    if(uv.x == 0.) return c.xxxx;//float32ToRGBA(round(mod(iTime, timeDelta)/timeDelta));
    else return float32ToRGBA(pitchOfHighestPlayingNoteOrZero(uv.x-1.));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    cellSize = iResolution.xy/vec2(17., nEntries);
    vec2 uv = round((fragCoord.xy - mod(fragCoord.xy, cellSize))/cellSize);
    // if(uv.x == 1. && uv.y == 2.) {
    //     fragColor = c.yyxy;
    //     return;
    // }
    // fragColor = .2*c.yxyy;

    if(iFrame == 0 || !currentTimeIntervalIsPresent()) {
        fragColor = addCurrentTimeInterval(uv);
    } else {
        fragColor = texture(iChannel0, fragCoord.xy/iResolution.xy);
    }
}
