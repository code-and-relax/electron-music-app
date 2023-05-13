var player;

function onPlayerReady(event) {
    document.getElementById(ui.play).addEventListener('click', togglePlay);
    timeupdater = setInterval(initProgressBar, 100);
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        document.getElementById(ui.play).classList.remove('pause');
        document.getElementById(ui.percentage).style.width = 0;
        document.getElementById(ui.currentTime).innerHTML = '00:00';
        player.seekTo(0, true);
    }
}

let ui = {
    play: 'playAudio',
    audio: 'audio',
    percentage: 'percentage',
    seekObj: 'seekObj',
    currentTime: 'currentTime'
};

function togglePlay() {
    if (player.getPlayerState() === 1) {
        player.pauseVideo();
        document.getElementById(ui.play).classList.remove('pause');
    } else {
        player.playVideo();
        document.getElementById(ui.play).classList.add('pause');
    }
}

function calculatePercentPlayed() {
    let percentage = (player.getCurrentTime() / player.getDuration()).toFixed(2) * 100;
    document.getElementById(ui.percentage).style.width = `${percentage}%`;
}

function calculateCurrentValue(currentTime) {
    const currentMinute = parseInt(currentTime / 60) % 60;
    const currentSecondsLong = currentTime % 60;
    const currentSeconds = currentSecondsLong.toFixed();
    const currentTimeFormatted = `${currentMinute < 10 ? `0${currentMinute}` : currentMinute}:${currentSeconds < 10 ? `0${currentSeconds}` : currentSeconds
        }`;

    return currentTimeFormatted;
}

function initProgressBar() {
    const currentTime = calculateCurrentValue(player.getCurrentTime());
    document.getElementById(ui.currentTime).innerHTML = currentTime;
    document.getElementById(ui.seekObj).addEventListener('click', seek);

    function seek(e) {
        const percent = e.offsetX / this.offsetWidth;
        player.seekTo(percent * player.getDuration());
    }

    calculatePercentPlayed();
}