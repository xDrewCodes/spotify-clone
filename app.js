
const APIController = (function () {

    const clientId = '59ab1b051efe489c923a30ab6b207851';
    const clientSecret = '7d1436de5b79441e8da1563ca44d832a';

    // private methods
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

    return {
        getToken() {
            return _getToken();
        },
        searchTracks(token, query, limit) {
            return _searchTracks(token, query, limit);
        },
        searchArtists(token, query, limit) {
            return _searchArtists(token, query, limit);
        }
    }
})();



let currentAudio = null;

const UIController = (function () {

    const DOMElements = {
        body: 'body',
        homeButton: '#nav__home--button',
        searchInput: '#search__input',
        searchButton: '#search__button',
        topResultContainer: '#result__top',
        additionalResultsContainer: '#result__songs',
        libraryContainer: '#library__container',
        playbackSong: '#playback__song'
    }

    const createTrackItem = (track) => {
        return `<div class="track__item">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <div class="track__info">
                        <p>${track.name}</p>
                        <p class="track__artist">${track.artists[0].name}</p>
                    </div>
                </div>`
    }

    const createArtistItem = (artist) => {
        return `<div class="artist__item">
                    <img src="${artist.images[0].url}" alt="${artist.name}">
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
                topResultContainer.innerHTML = createTrackItem(tracks[0])
            }

            tracks.slice(1, 5).forEach(track => {
                additionalResultsContainer.innerHTML += createTrackItem(track)
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
        displayPlaybackSong(pb) {
            const playbackSong = document.querySelector(DOMElements.playbackSong)
            pb.forEach(song => {
                playbackSong.innerHTML = createTrackItem(song)
            })
        },
        playTrack(track) {
            console.log(track)
            //  currentAudio = new Audio(track.preview_url);
            //  currentAudio.play().then(() => {
            //      console.log(`Playing: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`);
            //  }).catch(error => {
            //      console.error('Error playing track:', error);
            //  });
        },
        init() {

            document.querySelector(DOMElements.homeButton).addEventListener('click', async () => {
                document.querySelector(DOMElements.body).classList.remove('search__open')
                document.querySelector(DOMElements.searchInput).value = ''
            })
            
            document.querySelector(DOMElements.searchInput).addEventListener('change', async () => {
                
                if ( document.querySelector(DOMElements.searchInput).value == '' ) {
                    document.querySelector(DOMElements.body).classList.remove('search__open')
                    document.querySelector(DOMElements.searchInput).value = ''
                    return
                }

                const query = UIController.getInput()
                const token = await APIController.getToken()
                const tracks = await APIController.searchTracks(token, query)
                UIController.displayTracks(tracks)
                document.querySelector(DOMElements.body).classList.add('search__open')
            })

            document.querySelector(DOMElements.searchButton).addEventListener('click', async () => {
                const query = UIController.getInput()
                const token = await APIController.getToken()
                const tracks = await APIController.searchTracks(token, query)
                UIController.displayTracks(tracks)
                document.querySelector(DOMElements.body).classList.add('search__open')
            })

            window.addEventListener('load', async () => {
                const token = await APIController.getToken()

                const randomTrackQuery = 't'
                const randomArtistQuery = 't'

                const tracks = await APIController.searchTracks(token, randomTrackQuery, 8)
                const artists = await APIController.searchArtists(token, randomArtistQuery, 5)
                const pb = await APIController.searchTracks(token, '29 gold', 1)
                UIController.displayLibraryItems(tracks, artists)
                UIController.displayPlaybackSong(pb)



            })

        }
    }
})()

UIController.init()