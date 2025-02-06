
const APIController = (function () {

    const clientId = '59ab1b051efe489c923a30ab6b207851';
    const clientSecret = '7d1436de5b79441e8da1563ca44d832a';

    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'

        });

        const data = await result.json();
        return data.access_token;
    };

    const _searchTracks = async (token, query, limit = 7) => {

        const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }

        });

        const data = await result.json();

        if (data.tracks && data.tracks.items) {
            return data.tracks.items;
        } else {
            throw new Error('No tracks found');
        }
    };

    const _searchArtists = async (token, query, limit = 3) => {

        const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }

        });

        const data = await result.json();
        if (data.artists && data.artists.items) {
            return data.artists.items;
        } else {
            throw new Error('No artists found');
        }
    };

    const _searchAlbums = async (token, query, limit) => {

        const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
    })

        const data = await result.json()
        if ( data.albums && data.albums.items ) {
            return data.albums.items
        } else {
            throw new Error('No albums found')
        }

    }

    return {
        getToken() {
            return _getToken();
        },
        searchTracks(token, query, limit) {
            return _searchTracks(token, query, limit);
        },
        searchArtists(token, query, limit) {
            return _searchArtists(token, query, limit);
        },
        searchAlbums(token, query, limit) {
            return _searchAlbums(token, query, limit)
        }
    }
})();



let currentAudio = null;

const UIController = (function () {

    const DOMElements = {
        body: 'body',
        homeButton: '#nav__home--button',
        trackRec: '#home__track-rec',
        artistRec: '#home__artist-rec',
        searchInput: '#search__input',
        searchButton: '#search__button',
        topResultContainer: '#result__top',
        additionalResultsContainer: '#result__songs',
        recents: '#recents',
        libraryContainer: '#library__container',
        playbackSong: '#playback__song',
        playbackDur: '.playback__controls--bar'
    }

    const createTrackItem = (track) => {
        return `<div class="track__item">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <i class="fas fa-play track__item--play"></i>
                    <div class="track__info">
                        <p>${track.name}</p>
                        <p class="track__artist">${track.artists[0].name}</p>
                    </div>
                </div>`
    }

    const createTrackItemDur = (track) => {
        return `<div class="track__item">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <i class="fas fa-play track__item--play"></i>
                    <div class="track__info">
                        <p>${track.name}</p>
                        <p class="track__artist">${track.artists[0].name}</p>
                    </div>
                    <p class="track__dur">${Math.floor(track.duration_ms / 60000) + ':' + Math.floor((track.duration_ms / 1000) % 60).toString().padStart(2, '0')
            }</p>
                </div>`
    }

    const createArtistItem = (artist) => {
        return `<div class="artist__item">
                    <img src="${artist.images[0].url}" alt="${artist.name}">
                    <i class="fas fa-play track__item--play"></i>
                    <div class="artist__info">
                        <p>${artist.name}</p>
                    </div>
                </div>`
    }

    const createPlaybackSong = (track) => {
        return `<div class="playback__song--item">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <div class="track__info">
                        <p>${track.name}</p>
                        <p>${track.artists[0].name}</p>
                    </div>
                </div>`
    }

    const createRecSong = (track) => {
        return `<div class="home__track--item">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <div class="home__track--info">
                        <p>${track.name}</p>
                        <p class="home__track--artist">${track.artists[0].name}</p>
                    </div>
                </div>`
    }

    const createRecArtist = (artist) => {
        return `<div class="home__artist--item">
                    <img src="${artist.images[0].url}" alt="${artist.name}">
                    <div class="home__track--info">
                        <p>${artist.name}</p>
                        <p class="home__artist--sub-heading">Artist</p>
                    </div>
                </div>`
    }

    const createRecentItem = (recent, type, search) => {
        return `<div class="home__recent">
                    <img src="${search == 'track' ? recent.album.images[2].url : recent.images[0].url}" alt="${recent.name}">
                    <p>${recent.name}${ type != 'radio' ? '' : ' Radio' }</p>
                    <i class="fas fa-play home__recent--icon"></i>
                </div>`
    }

    const createNowPlayingItems = (track, artist) => {
        return `<div class="now-playing__container">
    <div class="now-playing__header">
        <h2 class="now-playing__title">${track.album.name}</h2>
        <div class="now-playing__header--icons">
            <i class="fas fa-ellipsis-h"></i>
            <i class="fas fa-times"></i>
        </div>
    </div>
    <img src="${track.album.images[0].url}" alt="" class="now-playing__img">
    <h2>${track.name}</h2>
    <h3>${artist.name}</h3>
    <div class="now-playing__artist-section">
        <img src="${artist.images[0].url}" alt="" class="now-playing__artist-section--img">
        <p class="now-playing__artist-section--title">About the artist</p>
        <div class="now-playing__artist-section--info">
            <div class="now-playing__artist-section--name">${artist.name}</div>
            <div class="now-playing__artist-section--listeners">${artist.followers.total.toLocaleString()} followers</div>
        </div>
    </div>
</div>`
    }

    return {
        getInput() {

            return document.querySelector(DOMElements.searchInput).value

        },
        displayTracks(tracks) {

            const topResultContainer = document.querySelector(DOMElements.topResultContainer)
            const additionalResultsContainer = document.querySelector(DOMElements.additionalResultsContainer)

            topResultContainer.innerHTML = ''
            additionalResultsContainer.innerHTML = ''

            if (tracks.length > 0) {

                topResultContainer.innerHTML = createTrackItemDur(tracks[0])
            }


            tracks.slice(1, 5).forEach(track => {

                additionalResultsContainer.innerHTML += createTrackItemDur(track)
            })


        },
        displayLibraryItems(tracks, artists, pb) {

            const libraryContainer = document.querySelector(DOMElements.libraryContainer)

            libraryContainer.innerHTML = ''

            tracks.forEach(track => {

                libraryContainer.innerHTML += createTrackItem(track)

            })

            artists.forEach(artist => {

                libraryContainer.innerHTML += createArtistItem(artist)

            })

        },
        async displayPlaybackSong(pb, artist) {

            const tk = await APIController.getToken()
            const trk = await APIController.searchTracks(tk, pb + ' ' + artist, 1)
            const art = await APIController.searchArtists(tk, artist, 1)

            const playbackSong = document.querySelector(DOMElements.playbackSong)
            const playbackDur = document.querySelector(DOMElements.playbackDur)
            playbackSong.innerHTML = createPlaybackSong(trk[0])
            
            UIController.nowPlaying(trk[0], art[0])

            const dur = trk[0].duration_ms
            playbackDur.innerHTML = Math.floor(dur / 60000) + ':' + Math.floor((dur / 1000) % 60)

        },
        displayHomeRecs(tracks, artists) {

            const trackRec = document.querySelector(DOMElements.trackRec)
            const artistRec = document.querySelector(DOMElements.artistRec)

            trackRec.innerHTML = ''

            tracks.forEach(song => {

                trackRec.innerHTML += createRecSong(song)

            })

            artistRec.innerHTML = ''

            artists.forEach(artist => {

                artistRec.innerHTML += createRecArtist(artist)

            })

        },
        nowPlaying(track, artist) {

            const nowPlayingRef = document.querySelector('#now-playing')
            nowPlayingRef.innerHTML = createNowPlayingItems(track, artist)

        },
        playbackSetup() {

            const els = document.getElementsByClassName('fa-play')

            
            Array.from(els).forEach((el) => {
                el.addEventListener('click', async () => {

                    const song = el.parentElement.querySelector('div').querySelector('p').textContent
                    const artist = el.parentElement.querySelector('div').querySelector('.track__artist').textContent

                    UIController.displayPlaybackSong( song, artist )


                })

            })

        },
        async load() {

            const token = await APIController.getToken()

            const randomTrackQuery = 't'
            const randomArtistQuery = 't'

            const randomRecQuery = 'ed sheeran'
            const favArtistsQuery = 'm'

            const tracks = await APIController.searchTracks(token, randomTrackQuery, 8)
            const artists = await APIController.searchArtists(token, randomArtistQuery, 8)
            const pb = 'dive ed sheeran'

            const recTracks = await APIController.searchTracks(token, randomRecQuery, 7)
            const recArtists = await APIController.searchArtists(token, favArtistsQuery, 7)

            UIController.displayLibraryItems(tracks, artists)
            UIController.displayPlaybackSong(pb, pb)
            UIController.displayHomeRecs(recTracks, recArtists)
            UIController.playbackSetup()

            const recents = [
                {
                    type: 'album',
                    search: 'album',
                    query: 'rockwood mark'
                },
                {
                    type: 'album',
                    search: 'album',
                    query: 'handwritten deluxe'
                },
                {
                    type: 'track',
                    search: 'track',
                    query: 'dive ed sheeran'
                },
                {
                    type: 'radio',
                    search: 'track',
                    query: 'make it mine jason mraz'
                },
                {
                    type: 'radio',
                    search: 'track',
                    query: 'free time ruel'
                },
                {
                    type: 'album',
                    search: 'album',
                    query: 'the human condition jon bellion'
                },
                {
                    type: 'track',
                    search: 'track',
                    query: 'aphrodites smile ethan surman'
                },
                {
                    type: 'radio',
                    search: 'artist',
                    query: 'jack johnson'
                }
            ]

            const recentsRef = document.querySelector(DOMElements.recents)
            
            for (let i = 0; i < recentsRef.childNodes.length; i++) {
                const trueI = Math.floor( i / 2 )

                if (i % 2 == 1) {

                    let recentItem
                    const imgBlur = document.getElementsByClassName('home__bg-img--container')[0]
                   
                    if ( recents[trueI].search == 'album' ) {
                        recentItem = await APIController.searchAlbums(token, recents[trueI].query, 1)
                        imgBlur.innerHTML += `<img class="home__recent--blur" src="${recentItem[0].images[0].url}"></img>`
                    } else if ( recents[trueI].search == 'artist' ) {
                        recentItem = await APIController.searchArtists(token, recents[trueI].query, 1)
                        imgBlur.innerHTML += `<img class="home__recent--blur" src="${recentItem[0].images[0].url}"></img>`
                    } else if ( recents[trueI].search == 'track' ) {
                        recentItem = await APIController.searchTracks(token, recents[trueI].query, 1)
                        imgBlur.innerHTML += `<img class="home__recent--blur" src="${recentItem[0].album.images[0].url}"></img>`
                    }
                    
                    recentsRef.childNodes[i].outerHTML = createRecentItem(
                        recentItem[0],
                        recents[trueI].type,
                        recents[trueI].search
                    )

                }

            }

        },
        init() {

            document.querySelector(DOMElements.homeButton).addEventListener('click', async () => {

                document.querySelector(DOMElements.body).classList.remove('search__open')
                document.querySelector(DOMElements.searchInput).value = ''

            })

            document.querySelector(DOMElements.searchInput).addEventListener('change', async () => {

                UIController.playbackSetup()

                if (document.querySelector(DOMElements.searchInput).value == '') {
                    document.querySelector(DOMElements.body).classList.remove('search__open')
                    return
                }

                const query = UIController.getInput()
                const token = await APIController.getToken()
                const tracks = await APIController.searchTracks(token, query)
                UIController.displayTracks(tracks)
                UIController.playbackSetup()
                document.querySelector(DOMElements.body).classList.add('search__open')

            })

            document.querySelector(DOMElements.searchButton).addEventListener('click', async () => {

                UIController.playbackSetup()

                const query = UIController.getInput()
                const token = await APIController.getToken()
                const tracks = await APIController.searchTracks(token, query)
                UIController.displayTracks(tracks)
                document.querySelector(DOMElements.body).classList.add('search__open')

            })

            window.addEventListener('load', async () => {

                UIController.load()

            })

        }
    }
})()

UIController.init()
