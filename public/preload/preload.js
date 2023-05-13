const { ipcRenderer, BrowserWindow } = require("electron")


let firstPress = 0;

window.onload = () => {

  const getPrompt = document.getElementById('sendPrompt');

  const getIframePlayer = () => {
    return document.querySelector('iframe#player[style*="display: none;"][style*="visibility: hidden;"]');
  }

  const closeWButton = document.querySelector('.barStyleClose')
  const minimizeWButton = document.querySelector('.barStyleMaximize')

  closeWButton.addEventListener('click', () => {
    window.close()
  })

  minimizeWButton.addEventListener('click', () => {
    const promptValue = 'Succes minimization!';

    ipcRenderer.send('minimizeW', promptValue);
  })


  const audioPlayer = {
    player: document.getElementById('player'),
    audio_player: document.getElementById('audio-player'),
    time_slider: document.getElementById('time-slider'),
    play_pause_video: document.getElementById('playAudio'),
    pauseImage: document.getElementById('pause')
  }

  audioPlayer.play_pause_video.addEventListener('click', () => {
    let isPaused = audioPlayer.play_pause_video.classList.contains('pause')
    if (isPaused) {
      audioPlayer.play_pause_video.classList.remove('pause')
      audioPlayer.pauseImage.src = '../data/play.png'
    } else {
      audioPlayer.play_pause_video.classList.add('pause')
      audioPlayer.pauseImage.src = '../data/pause.png'
    }
  })


  let promptValue;
  getPrompt.addEventListener('click', () => {
    promptValue = document.getElementById('getInputSearchData').value;
    ipcRenderer.send('getPromptFromHTML', promptValue);

    if (firstPress > 0) {
      let savedPlayer = audioPlayer.player;
      let savedAudioPlayer = audioPlayer.audio_player;
      getIframePlayer().remove();
      audioPlayer.player.remove();
      audioPlayer.audio_player.remove();
      audioPlayer.time_slider.appendChild(savedPlayer);
      audioPlayer.time_slider.appendChild(savedAudioPlayer);
      let isPaused = audioPlayer.play_pause_video.classList.contains('pause')
      if (isPaused) {
        audioPlayer.play_pause_video.classList.remove('pause')
        audioPlayer.pauseImage.src = '../data/play.png'
      } else {
        audioPlayer.play_pause_video.classList.add('pause')
      }
    } else {
      firstPress++;
    }
  });

  ipcRenderer.on('objYoutube', async (_, data) => {

    let videos = [];

    let videosCounter = 0;

    for (const item of data) {
      await Promise.all(item.videos.map(async (video) => {
        const response = await fetch(`https://www.youtube.com/embed/${video.videoRenderer.videoId}`);
        const html = await response.text();
        const parser = new DOMParser();
        const document = parser.parseFromString(html, 'text/html').head;
        const errorDiv = document.querySelector('meta[name="robots"][content="noindex"]');

        if (!errorDiv) {
          const id = video.videoRenderer.videoId;
          const thumbnail = video.videoRenderer.thumbnail.thumbnails[0].url;
          const title = video.videoRenderer.title.runs[0].text;
          const channelArtist = item.channel.name;

          videos.push({ id, thumbnail, title, channelArtist });

          videosCounter++;
        }
      }));
    }

    const videoData = {
      thumbnail: document.getElementById('song-thumbnail'),
      artist: document.getElementById('song-artist'),
      title: document.getElementById('song-title')
    };

    if (videos.length > 0) {
      /* Do nothing! */
    } else {
      videos = [];
    }

    let currentVideoIndex = 0;

    const updateVideoData = ({ thumbnail, title, channelArtist }) => {
      videoData.thumbnail.src = thumbnail;
      videoData.title.innerText = title;
      videoData.artist.innerText = channelArtist || promptValue;
    };



    const goForward = document.querySelector('#button_forward');
    const goBackward = document.querySelector('#button_backward');

    const navigateVideo = (index) => {
      currentVideoIndex = index;
      let savedPlayer = audioPlayer.player;
      let savedAudioPlayer = audioPlayer.audio_player;
      getIframePlayer().remove();
      audioPlayer.player.remove();
      audioPlayer.audio_player.remove();
      audioPlayer.time_slider.appendChild(savedPlayer);
      audioPlayer.time_slider.appendChild(savedAudioPlayer);
      let isPaused = audioPlayer.play_pause_video.classList.contains('pause');
      if (isPaused) {
        audioPlayer.play_pause_video.classList.remove('pause');
        audioPlayer.pauseImage.src = '../data/play.png';
      } else {
        audioPlayer.play_pause_video.classList.add('pause');
        audioPlayer.pauseImage.src = '../data/pause.png';
      }
      updateVideoData(videos[currentVideoIndex]);
      onYouTubeIframeAPIReady(videos[currentVideoIndex].id.toString());
    };

    goForward.addEventListener('click', () => {
      if (currentVideoIndex < videos.length - 1) {
        if (!audioPlayer.play_pause_video.classList.contains('pause')) {
          audioPlayer.play_pause_video.classList.add('pause');
          audioPlayer.pauseImage.src = '../data/play.png';
        } else {
          audioPlayer.pauseImage.src = '../data/pause.png';
        }
        navigateVideo(currentVideoIndex + 1);
      }
    });

    goBackward.addEventListener('click', () => {
      if (currentVideoIndex > 0) {
        if (!audioPlayer.play_pause_video.classList.contains('pause')) {
          audioPlayer.play_pause_video.classList.add('pause');
          audioPlayer.pauseImage.src = '../data/play.png';
        } else {
          audioPlayer.pauseImage.src = '../data/pause.png';
        }
        navigateVideo(currentVideoIndex - 1);
      }
    });

    if (videos.length > 0) {
      updateVideoData(videos[0]);

      onYouTubeIframeAPIReady((videos[0].id).toString())


    }

    function onYouTubeIframeAPIReady(id) {
      player = new YT.Player('player', {
        videoId: id,
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }
  });

}

let _version = ['1.0.0', '1.1.0'].slice(-1)[0]; 
let modifications = `
    - Added the favorites list in the version: ${_version},
    - Modification of the appearance in the version: ${_version}
`;

console.log(`
    Log:
        ${modifications}
`);
