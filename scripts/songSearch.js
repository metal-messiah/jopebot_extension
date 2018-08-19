/**
 * Created by Porter on 11/25/2017.
 */
var fuse, songsList, selectedSong, outMsgState, versionNumber, allSongs;

var streamerConfig;



function getSongs(version, channel, config) {


    streamerConfig = config;
    // ngrokURL = ngrok;
    versionNumber = version || "0.0.0";
    // console.log(version);
    // config = JSON.parse(config);



    $.get("https://www.jopebot.com/api/data?channel=" + channel + "&songs=true", function (data) {

        allSongs = data.songs;
        gotSongs = true;

        initSongSearch(allSongs, version, config)

    })

}

function initSongSearch(songsList, version, config) {
    //// console.log(songsList);

    //// console.log(JSON.stringify(config));
    if (songsList != 'false' && songsList.length) {

        // console.log(songsList);


        var options = {
            shouldSort: true,
            tokenize: false,
            findAllMatches: true,
            includeScore: true,
            includeMatches: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 3,
            keys: [{
                    name: "songName",
                    weight: 0.35
                },
                {
                    name: "artistName",
                    weight: 0.35
                },
                {
                    name: "albumName",
                    weight: 0.1
                },
                {
                    name: "charterName",
                    weight: 0.1
                },
                {
                    name: "genreName",
                    weight: 0.1
                }
            ]
        };

        fuse = new Fuse(songsList, options);

        $("#songSearchSubmit").click(function () {
            // $("#songSearchResults").html("<br><i class='fas fa-crosshairs fa-spin'></i>")
            songSearch()
        })

    }
    else{

    }


}


function songSearch() {
    // console.log("SEARCH!")
    try {
        // $("#songSearchSubmit").html("<i class='fas fa-crosshairs fa-spin fa-2x'></i>")
        var term = $("#songSearch").val();
        // console.log(term)
        if (term.length >= 3) {
            // // console.log(term)
            var results = fuse.search(term);
            // // console.log(results);
            if (streamerConfig.songs_max_minutes) {
                results = results.filter(song => (song.item.songLength / 1000 / 60) < streamerConfig.songs_max_minutes)
            }
            // console.log(results.length)
            var output = `<table class='songsTable'><tr><th>Song</th><th>Artist</th><th>Genre</th></tr>${results.splice(0,200).map(song => {
                return `<tr title='Click Me!'><td>${song.item.songName}</td><td>${song.item.artistName}</td><td>${song.item.genreName}</td></tr>`
            }).join("")}</table>`
            $("#songSearchResults").html(output)
            // $("#songSearchSubmit").html("Search")
        

            $(".songsTable tr").click(function (e) {
                var req = e.currentTarget.children[0].innerText
                var artist = e.currentTarget.children[1].innerText

                if ($("#requestTab:visible").length) {

                    // console.log(req, artist)

                    $("#requestInput").val(`${req} - ${artist}`);
                    $("#submitRequest").removeAttr("disabled");
                    $("#requestTab").click();
                }
            })
        } else {
            $("#songSearchResults").html("<br>Search Must Be At Least 3 Characters Long")
            // $("#songSearchSubmit").html("Search")
        

        }
    } catch (err) {
        // console.log(err)
    }
}