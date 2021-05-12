// Texture layout:
// x axis: pixel 0: time interval index. channels 1 - 16 in pixel 1 - 16.
// y axis: time steps, in descending order (higher is newer).
// pixel content: pitch of first note in the time frame.

// Constants
const float timeDelta = .5;
const vec3 c = vec3(1.,0.,-1.);

// Check if current time interval is already present in the texture.
bool currentTimeIntervalIsPresent() {
    return int(round(mod(iTime, timeDelta)/timeDelta)) == int(texelFetch(iChannel0, ivec2(0), 0).x);
}

// Returns the pitch of the lowest note currently playing in channel, or zero if none is playing.
float pitchOfHighestPlayingNoteOrZero(float channel) {
    float pitch = 0.;
    for(int i = 127; i>=0; --i)
        if(texelFetch(iChannel1, ivec2(i, 5*channel + 1), 0).x < timeDelta)
            pitch = float(i);
    return pitch;
}

// Add current time interval, moving everything else one line higher.
vec4 addCurrentTimeInterval(vec2 uv) {
    if(uv.y > 0.) return texelFetch(iChannel0, ivec2(uv) - ivec2(0,1), 0);
    if(uv.x == 0.) return round(mod(iTime, timeDelta)/timeDelta)*c.xyyy;
    else if(uv.x <= 16.) return pitchOfHighestPlayingNoteOrZero(uv.x-1.)*c.xyyy;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = floor(fragCoord);

    if(iFrame == 0 || !currentTimeIntervalIsPresent()) {
        fragColor = addCurrentTimeInterval(uv);
    } else {
        fragColor = texelFetch(iChannel0, ivec2(uv), 0);
    }
}
