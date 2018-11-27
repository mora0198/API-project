let ZoeCode = (function () {
    /* globals APIKEY*/

    const movieDataBaseURL = "https://api.themoviedb.org/3/";
    let imageURL = null;
    let imageSizes = [];
    let searchString = "";
    const staleDataTimeOut = 3600;
    let mode = "movie";

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        // console.log(APIKEY);
        addEventListeners();
        getDataFromLocalStorage();
        getPosterURLAndSizes();

        document.getElementById("search-input")
            .addEventListener("keydown", function (event) {

                if (event.keyCode == 13) {
                    startSearch();
                    event.preventDefault();
                    document.getElementById("search-button").click;
                }
            });
        document.querySelector("#modalButton").addEventListener("click", showOverlay);
        document
            .querySelector(".cancelButton")
            .addEventListener("click", hideOverlay);
        document.querySelector(".overlay").addEventListener("click", hideOverlay);

        document.querySelector(".saveButton").addEventListener("click", function (e) {
            let movieList = document.getElementsByName("movie-data");
            let movieType = null;
            for (let i = 0; i < movieList.length; i++) {
                if (movieList[i].checked) {
                    movieType = movieList[i].value;
                    break;
                }
            }
            console.log("You picked " + movieType);
            if (document.getElementById("movie").checked) {
                mode = "movie";
                if (searchString != "") {
                    getSearchResults();
                }
            } else {
                mode = "tv";
                if (searchString != "") {
                    getTvResults();
                }
            }
            hideOverlay(e);

        });

        function showOverlay(e) {
            e.preventDefault();
            let overlay = document.querySelector(".overlay");
            overlay.classList.remove("hide");
            overlay.classList.add("show");
            showModal(e);
        }

        function showModal(e) {
            e.preventDefault();
            let modal = document.querySelector(".modal");
            modal.classList.remove("off");
            modal.classList.add("on");
        }

        function hideOverlay(e) {
            e.preventDefault();
            e.stopPropagation(); // don't allow clicks to pass through
            let overlay = document.querySelector(".overlay");
            overlay.classList.remove("show");
            overlay.classList.add("hide");
            hideModal(e);
        }

        function hideModal(e) {
            e.preventDefault();
            let modal = document.querySelector(".modal");
            modal.classList.remove("on");
            modal.classList.add("off");
        }

        function addEventListeners() {
            let searchButton = document.querySelector(".searchButtonDiv");
            searchButton.addEventListener("click", startSearch);

        }

    }

    function getDataFromLocalStorage() {

        if (localStorage.getItem(imageURL, imageSizes)) {
            console.log("Retrieving Saved Date from Local Storage");
            let savedDate = localStorage.getItem(imageURL, imageSizes); // get the saved date sting
            savedDate = new Date(savedDate); // use this string to initialize a new Date object
            console.log(savedDate);

            let seconds = calculateElapsedTime(savedDate);

            if (seconds > staleDataTimeOut) {
                console.log("Local Storage Data is stale");
                saveDateToLocalStorage();
            }
        } else {
            saveDateToLocalStorage();
            getPosterURLAndSizes();
        }
    }

    function saveDateToLocalStorage() {
        console.log("Saving current Date to Local Storage");
        let now = new Date();
        localStorage.setItem(imageURL, now);
    }

    function calculateElapsedTime(savedDate) {
        let now = new Date(); // get the current time
        console.log(now);

        // calculate elapsed time
        let elapsedTime = now.getTime() - savedDate.getTime(); // this in milliseconds

        let seconds = Math.ceil(elapsedTime / 1000);
        console.log("Elapsed Time: " + seconds + " seconds");
        return seconds;
    }

    function getPosterURLAndSizes() {
        // https://api.themoviedb.org/3/configuration?api_key=<<api_key>>
        let url = `${movieDataBaseURL}configuration?api_key=${APIKEY}`;

        fetch(url)
            .then(function (reponse) {
                return reponse.json();
            })
            .then(function (data) {
                console.log(data);
                imageURL = data.images.secure_base_url;
                imageSizes = data.images.poster_sizes;

                console.log(imageURL);
                console.log(imageSizes);
            })
            .catch(function (error) {
                console.log(error);
            })
    }
    // start the initial seach from the app home page

    function startSearch() {
        console.log("start search");
        searchString = document.getElementById("search-input").value;
        if (!searchString) {
            alert("Please enter search data");
            document.getElementById("search-input").focus();
            return;
        }
        // this is a new search so you should reset any existing page data

        if (mode === "movie") {
            getSearchResults();
        } else {

            getTvResults();
        }
    }

    function getSearchResults() {
        let url = `${movieDataBaseURL}search/movie?api_key=${APIKEY}&query=${searchString}`;
        fetch(url)
            .then(response => response.json())
            .then((data) => {
                console.log(data);

                createPage(data);

            })
            .catch((error) => alert(error));
    }

    function getTvResults() {
        let url = `${movieDataBaseURL}search/tv?api_key=${APIKEY}&query=${searchString}`;
        console.log(url);
        fetch(url)
            .then(response => response.json())
            .then((data) => {
                console.log(data);

                createtvPage(data);

            })
            .catch((error) => alert(error));
    }

    function createPage(data) {
        let content = document.querySelector("#search-results>.content");
        let title = document.querySelector("#search-results>.title");

        let message = document.createElement("h2");
        content.innerHTML = "";
        title.innerHTML = "";

        if (data.total_results == 0) {
            message.innerHTML = `No results found for ${searchString}`;
        } else {
            message.innerHTML = `Total results = ${data.total_results} for ${searchString}`;
        }


        title.appendChild(message);

        let documentFragment = new DocumentFragment();

        documentFragment.appendChild(createMovieCards(data.results));

        content.appendChild(documentFragment);

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", getRecommendations);
        });

    }

    function createtvPage(data) {
        let content = document.querySelector("#search-results>.content");
        let title = document.querySelector("#search-results>.title");

        let message = document.createElement("h2");
        content.innerHTML = "";
        title.innerHTML = "";

        if (data.total_results == 0) {
            message.innerHTML = `No results found for ${searchString}`;
        } else {
            message.innerHTML = `Total results = ${data.total_results} for ${searchString}`;
        }

        title.appendChild(message);


        let documentFragment = new DocumentFragment();

        documentFragment.appendChild(createTvCards(data.results));

        content.appendChild(documentFragment);

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", getTvRecommendations);
        });
    }

    function createMovieCards(results) {
        let documentFragment = new DocumentFragment(); // use a documentFragment for performance

        results.forEach(function (movie) {

            let movieCard = document.createElement("div");
            let section = document.createElement("section");
            let image = document.createElement("img");
            let videoTitle = document.createElement("p");
            let videoDate = document.createElement("p");
            let videoRating = document.createElement("p");
            let videoOverview = document.createElement("p");

            // set up the content
            videoTitle.textContent = movie.title;
            videoDate.textContent = movie.release_date;
            videoRating.textContent = movie.vote_average;
            videoOverview.textContent = movie.overview;

            image.src = `${imageURL}${imageSizes[2]}${movie.poster_path}`;

            // set up movie data attributes
            movieCard.setAttribute("data-title", movie.title);
            movieCard.setAttribute("data-id", movie.id);

            // set up class names
            movieCard.className = "movieCard";
            section.className = "imageSection";
            videoTitle.className = "videoTitle";

            // append elements
            section.appendChild(image);
            movieCard.appendChild(section);
            movieCard.appendChild(videoTitle);
            movieCard.appendChild(videoDate);
            movieCard.appendChild(videoRating);
            movieCard.appendChild(videoOverview);

            documentFragment.appendChild(movieCard);

        });
        return documentFragment;
    }

    function createTvCards(results) {
        let documentFragment = new DocumentFragment(); // use a documentFragment for performance

        results.forEach(function (tv) {

            let tvCard = document.createElement("div");
            let section = document.createElement("section");
            let image = document.createElement("img");
            let videoTitle = document.createElement("p");
            let videoDate = document.createElement("p");
            let videoRating = document.createElement("p");
            let videoOverview = document.createElement("p");

            // set up the content
            videoTitle.textContent = tv.name;
            videoDate.textContent = tv.release_date;
            videoRating.textContent = tv.vote_average;
            videoOverview.textContent = tv.overview;

            image.src = `${imageURL}${imageSizes[2]}${tv.poster_path}`;

            // set up movie data attributes
            tvCard.setAttribute("data-name", tv.name);
            tvCard.setAttribute("data-id", tv.id);

            // set up class names
            tvCard.className = "tvCard";
            section.className = "imageSection";
            videoTitle.className = "videoTitle";

            // append elements
            section.appendChild(image);
            tvCard.appendChild(section);
            tvCard.appendChild(videoTitle);
            tvCard.appendChild(videoDate);
            tvCard.appendChild(videoRating);
            tvCard.appendChild(videoOverview);

            documentFragment.appendChild(tvCard);

        });
        return documentFragment;
    }

    function getRecommendations() {
        //console.log(this);
        let movieTitle = this.getAttribute("data-title");
        let movieID = this.getAttribute("data-id");
        console.log("you clicked: " + movieTitle + "" + movieID);

        let url = `${movieDataBaseURL}movie/${movieID}/recommendations?api_key=${APIKEY}&query=${searchString}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                //create the page from data
                createPage(data);
                //navigate to results

            })
            .catch(error => console.log(error));
    }

    function getTvRecommendations() {
        //console.log(this);
        let tvName = this.getAttribute("data-name");
        let tvID = this.getAttribute("data-id");
        console.log("you clicked: " + tvName + "" + tvID);

        let url = `${movieDataBaseURL}tv/${tvID}/recommendations?api_key=${APIKEY}&query=${searchString}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                //create the page from data
                createPage(data);
                //navigate to results

            })
            .catch(error => console.log(error));
    }
})();
