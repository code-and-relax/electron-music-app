const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fetch = require('cross-fetch')
const { promisify } = require('util')
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => blocker.enableBlockingInSession(session.defaultSession));


const getPromptSearch = promisify(() => {
    return new Promise((resolve, reject) => {
        try {
            const win_getSearch = new BrowserWindow({
                frame: false,
                transparent: true,
                width: 500,
                height: 850,
                resizable: false,
                titleBarStyle: 'hidden',
                webPreferences: {
                    contextIsolation: false,
                    nodeIntegration: true,
                    preload: path.join(__dirname, 'preload', 'preload.js'),
                },
            });
            win_getSearch.loadFile(path.join(__dirname, 'views', 'index.html'));
            ipcMain.on('getPromptFromHTML', async (_, data) => {
                resolve(data);

                const ytObj = await searchOnYoutube(data);
                const finallyData = await matchYTInitialData(ytObj, data)

                win_getSearch.webContents.send('objYoutube', finallyData)
            });
            ipcMain.on('minimizeW', async (_, data) => {
                resolve(data)
                win_getSearch.isMaximized ? win_getSearch.minimize() : win_getSearch.maximize()
            })
        } catch (e) {
            reject(e);
        }
    });
});


const searchOnYoutube = (query) => {
    const win_youtube = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload', 'preload.js'),
        },
    });

    win_youtube.loadURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);

    return new Promise((resolve, reject) => {
        win_youtube.webContents.on('did-finish-load', () => {
            win_youtube.webContents.executeJavaScript('document.body.innerHTML')
                .then((data) => {
                    win_youtube.close();
                    resolve(data);
                })
                .catch((error) => {
                    win_youtube.close();
                    reject(error);
                });
        });
    });
};



const extractChannelData = (channelData, prompt) => {
    if (!channelData) {
        return { prompt, channelFound: false };
    }

    const ytLink = 'https://www.youtube.com';
    const name = channelData.title.simpleText || 'Undefined';
    const url =
        (ytLink + channelData.navigationEndpoint.commandMetadata.webCommandMetadata.url) || 'Undefined';
    const thumbnail = channelData.thumbnail.thumbnails[0].url || 'Undefined';

    return { name, url, thumbnail };
};


const extractVideoData = (data) => {
    return data
        .map((item) => {
            const { channelRenderer, shelfRenderer, reelShelfRenderer, ...rest } = item;
            return rest;
        })
        .filter((items) => Object.keys(items).length > 0)
        .filter(({ videoRenderer }) => {
            if (videoRenderer) {
                const { videoId, thumbnail, title } = videoRenderer;
                return { videoRenderer: { videoId, thumbnail, title } };
            }
            return false;
        });
};


const matchYTInitialData = async (html, prompt) => {
    try {
        const regex = /var ytInitialData = (\{.*?\});/s;
        const match = html.match(regex);
        if (!match) {
            throw new Error('ytInitialData not found');
        }
        const parsedData = JSON.parse(match[1]);

        const data = parsedData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

        const channelData = data[0].channelRenderer;
        const channel = extractChannelData(channelData, prompt);
        const videos = await extractVideoData(data.slice(1));

        return [{ channel, videos }];
    } catch (error) {
        console.error(error);
        throw error;
    }
};


app.on('ready', async () => {
    try {

        getPromptSearch();

    } catch (error) {
        console.error(error);
    }
});

app.on('window-all-closed', () => {
    app.quit()
})
