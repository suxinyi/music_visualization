
function onInputFileChange() {
    var file = $('#audioSource').get(0).files[0];
    $('#audioElement').get(0).src = window.URL.createObjectURL(file);
    main();
}


function getWindowWidth() {
    return window.innerWidth;
}

function createSvg(parent, height, width) {
    return d3.select(parent).append('svg').attr('height', height).attr('width', width);
}

function renderFrame(parent, height, width, analyser, initFunc, updateFunc, renderFunc) {
    var data = new Uint8Array(200);

    var svg = createSvg(parent, height, width);

    var para = {'height': height, 'width': width, 'barPadding': '1'};
    initFunc(svg, data, para);
    function renderChart() {
        requestAnimationFrame(renderChart);
        data = updateFunc(analyser, data);
        renderFunc(svg, data, para);
    }

    renderChart();
}

function _byte2Hex(n)
{
    var nybHexString = "0123456789ABCDEF";
    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}

function _RGB2Color(r,g,b)
{
    return '#' + _byte2Hex(r) + _byte2Hex(g) + _byte2Hex(b);
}

function makeColorGradient(i, frequency1, frequency2, frequency3,
                           phase1, phase2, phase3,
                           center, width)
{
    if (frequency1 == undefined)
        frequency1 = 0.1;
    if (frequency2 == undefined)
        frequency2 = 0.1;
    if (frequency3 == undefined)
        frequency3 = 0.1;
    if (phase1 == undefined)
        phase1 = 0;
    if (phase2 == undefined)
        phase2 = 2;
    if (phase3 == undefined)
        phase3 = 4;
    if (center == undefined)
        center = 200;
    if (width == undefined)
        width = 55;

    var red = Math.sin(frequency1*i + phase1) * width + center;
    var grn = Math.sin(frequency2*i + phase2) * width + center;
    var blu = Math.sin(frequency3*i + phase3) * width + center;
    return _RGB2Color(red,grn,blu);
}

function makeColorGrid(value) {
    var colors = ["#ffebe6","#f89cb8","#f882a3","#e95573",
        "#e97d83","#e95369","#e9384e","#e92436",
        "#cd0000"];
    return colors[Math.floor(value / 32)];
}

function playDefaultAudio(){
    console.clear();

// instigate our audio context

// for cross browser
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

// load some sound
    const audioElement = document.querySelector('audio');
    const track = audioCtx.createMediaElementSource(audioElement);

    const playButton = document.querySelector('.tape-controls-play');

// play pause audio
    playButton.addEventListener('click', function() {

        // check if context is in suspended state (autoplay policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (this.dataset.playing === 'false') {
            audioElement.play();
            this.dataset.playing = 'true';
            // if track is playing pause it
        } else if (this.dataset.playing === 'true') {
            audioElement.pause();
            this.dataset.playing = 'false';
        }

        let state = this.getAttribute('aria-checked') === "true" ? true : false;
        this.setAttribute( 'aria-checked', state ? "false" : "true" );

    }, false);

// if track ends
    audioElement.addEventListener('ended', () => {
        playButton.dataset.playing = 'false';
        playButton.setAttribute( "aria-checked", "false" );
    }, false);

// volume
    const gainNode = audioCtx.createGain();

    const volumeControl = document.querySelector('[data-action="volume"]');
    volumeControl.addEventListener('input', function() {
        gainNode.gain.value = this.value;
    }, false);

// panning
    const pannerOptions = {pan: 0};
    const panner = new StereoPannerNode(audioCtx, pannerOptions);

    const pannerControl = document.querySelector('[data-action="panner"]');
    pannerControl.addEventListener('input', function() {
        panner.pan.value = this.value;
    }, false);

// connect our graph
    track.connect(gainNode).connect(panner).connect(audioCtx.destination);

    const powerButton = document.querySelector('.control-power');

    powerButton.addEventListener('click', function() {
        if (this.dataset.power === 'on') {
            audioCtx.suspend();
            this.dataset.power = 'off';
        } else if (this.dataset.power === 'off') {
            audioCtx.resume();
            this.dataset.power = 'on';
        }
        this.setAttribute( "aria-checked", state ? "false" : "true" );
        console.log(audioCtx.state);
    }, false);

// Track credit: Outfoxing the Fox by Kevin MacLeod under Creative Commons



}

function main() {

    var framesFuncsArray = [bar_time_domain, bar_frequency_domain, grid_frequency_domain];

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var audioElement = $('#audioElement').get(0);
    var audioSrc = audioCtx.createMediaElementSource(audioElement);


    var analyser = audioCtx.createAnalyser();

    audioSrc.connect(analyser);
    // audioSrc.connect(analyser);
    audioSrc.connect(audioCtx.destination);


    var width_long = getWindowWidth() * 0.4;
    var width_short = width_long;

    for (var i = 0; i < framesFuncsArray.length; i++) {
        renderFrame(
            '#d' + i.toString(),
            '300',
            i < 2 ? width_short.toString() : width_long.toString(),
            analyser,
            framesFuncsArray[i].init,
            framesFuncsArray[i].update,
            framesFuncsArray[i].render
        )
    }


}
