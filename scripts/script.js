/**
 * Course: COMP 426
 * Assignment: Final Project
 * Author: Chris Kong
 *
 *  This is the final project for the COMP 426 course I was enrolled in (Spring 2021).
 *  The general gist is that this is an rhythm-based game that is coded as a web app.
 * 
 */

// These are a list of global variables that will be utilized throughout the game.
let hits = {
    perfect: 0,
    good: 0,
    okay: 0,
    miss: 0,
}
const score_multiplier = {
    combo30: 2,
    combo50: 3,
    perfect: 1.5,
    good: 1.0,
    okay: 0.8,
    miss: 0.0,
}
let combo = 0;
let maxCombo = 0;
let score = 0;
let startTime = 0.0;
let currentUserId = "";
let isLoggedIn = false;
let isEnded = false;
let userScore = 0;
let isLight = true;

let db = firebase.firestore();

let YOUTUBE_KEY = "";
let GIPHY_KEY = "";
db.collection("keys").doc("keys").get().then((doc)=>{
    YOUTUBE_KEY = doc.data().YOUTUBE_KEY;
    GIPHY_KEY = doc.data().GIPHY_KEY;
});



// This is the main function that renders the initial game and handles all event handlers. 
const loadGame = function () {
    const $root = $("#root");
    $root.append(renderInitialScreen())
    renderNotes();
    $root.on("click", "#play-button", renderGameStart);
    $root.on("click", "#login-button", renderLogin);
    $root.on("click","#signup-button", renderSignup);
    $root.on("click", "#login-back-button", renderBackLogin);
    $root.on("click", "#back-button", renderLoginBackMenu);
    $root.on("click", "#back-button", renderSignupBackMenu);
    $root.on("click", "#login-user-button", verifyLogin);
    $root.on("click", "#signup-user-button", verifySignUp);
    $root.on("click", "#leaderboard-button", renderLeaderboard);
    $root.on("click", "#controls-button", renderControls);
    $root.on("click", "#back-button", renderControlsBackMenu);
    $root.on("click", "#back-button", renderLeaderboardBackMenu)
    $root.on("click", "#back-button", renderGameEndMenu);
    $root.on("change", "#volume-slider", handleVolumeControl);
    $root.on("click", "#end-button", endGame);
    $root.on("click", "#toggle-theme-button", renderTheme);
    $root.on("click", "#signout-button", renderSignOut);
    $root.on("click", "#back-button", renderSignOutBackMenu)
    calculateMiss();
    handleKeys();
}

// Renders the theme of the page (light vs dark), also saves preferences if user is logged in.
const renderTheme = function (){
    if (isLight){
        isLight = false;
        $("html").removeClass("light");
        $(".track-container").removeClass("light");
        $(".track").removeClass("light");
        $(".menu-container").removeClass("light");
        $(".menu-button").removeClass("light");
        $(".hit-accuracy").removeClass("light");
        $(".hit-combo").removeClass("light");
    }
    else{
        isLight = true;
        $("html").attr("class","light");
        $(".track-container").addClass("light");
        $(".track").addClass("light");
        $(".menu-container").addClass("light");
        $(".menu-button").addClass("light");
        $(".hit-accuracy").addClass("light");
        $(".hit-combo").addClass("light");
    }
    if (isLoggedIn){
        db.collection("users").doc(currentUserId).get().then((doc) => {
            const newTheme = isLight ? "light" : "dark";
            db.collection("users").doc(currentUserId).update({
                theme: newTheme,
            });
        });
    }
}

// Renders the main menu and game.
const renderInitialScreen = function () {
    const gameScreen =
        `<div class="menu-container">
        <div class="initial-view">
            <h1 id="game-title">&#9835 Rameses' Rhythm Rally &#9835 </h1>
            <p id="author-tag"> by Chris Kong </p>
            <div class="main-menu">
                <button type="button" class="menu-button" id="play-button">Play Game!</button>
                <button type="button" class="menu-button" id="login-button">Login</button>
                <button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                <button type="button" class="menu-button" id="controls-button">Controls</button>
                <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score!
                <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
            </div>
        </div>
    </div>
    <div class = "game-container">
        <div class = "hit-display">
            <div class="countdown"></div>
            <div class="hit-combo"></div>
            <div class="hit-accuracy"></div>
        </div>
        <div class = "key-container">
            <div class="key" id="left-key">
                <p>&#8592</p>
            </div>
            <div class="key" id="up-key">
                <p>&#8593</p>
            </div>
            <div class="key" id="down-key">
                <p>&#8595</p>
            </div>
            <div class="key" id="right-key">
                <p>&#8594</p>
            </div>
        </div>
        <div class = "track-container">
            <div class="track"></div>
            <div class="track"></div>
            <div class="track"></div>
            <div class="track"></div>
        </div>
    </div>`;
    return gameScreen;
}

const renderSignOut = function (){
    firebase.auth().signOut().then(() => {
        isLoggedIn = false;
        const signOutString = 
        `<div class = "signout-menu">
        <table id="signout-field">
            <tbody>
            <tr id="error-cell"><td><p id="success-message">You have been signed out successfully. Go back to the main menu.</p></td></tr>
            </tbody>
        </table>
        <button type="button" class="menu-button" id="back-button">Back to Menu</button>
        </div>`;
        $('.main-menu').fadeOut("slow", function (){
            $('.main-menu').replaceWith(signOutString);
            if (isLight){
                $('.menu-button').addClass("light");
            }
        })
    });
}

const renderSignOutBackMenu = function (){
    $(".signout-menu").fadeOut("slow", function () {
        $(".signout-menu").replaceWith(
            `<div class="main-menu">
                <button type="button" class="menu-button" id="play-button">Play Game!</button>
                <button type="button" class="menu-button" id="login-button">Login</button>
                <button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                <button type="button" class="menu-button" id="controls-button">Controls</button>
                <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score!
                <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
            </div>`);
        $(".main-menu").fadeTo("slow", 1);
        if (isLight){
            $('.menu-button').addClass("light");
        }
    });
}

// This will render the UI that will prompt the user to login with
// existing credentials. This is needed to save scores for the leaderboard.
const renderLogin = function () {
    $(".main-menu").fadeOut("slow", function () {
        if (!isLoggedIn){
            $(".main-menu").replaceWith(
                `<div class = "login-menu">
                    <table id="login-field">
                        <tbody>
                        <tr id="error-cell"><td><p id="error-message"></p></td></tr>
                        <tr id="email-cell"><td><label for = "email">Email: </label><input id="email" type="text"></td></tr>
                        <tr id="password-cell"><td><label for = "password">Password:   </label><input id="password" type="password"></td></tr>
                        </tbody>
                    </table>
                    <button type="button" class="menu-button" id="login-user-button">Login</button>
                    <button type="button" class="menu-button" id="signup-button">Sign Up Instead</button>
                    <button type="button" class="menu-button" id="back-button">Back to Menu</button>
                    </div>`);
        }
        else{
            $(".main-menu").replaceWith(
                `<div class = "login-menu">
                    <table id="login-field">
                        <tbody>
                        <tr id="error-cell"><td><p id="success-message">You have been logged in successfully. Go back to the main menu.</p></td></tr>
                        </tbody>
                    </table>
                    <button type="button" class="menu-button" id="back-button">Back to Menu</button>
                    </div>`);      
        }
        if(isLight){
            $(".menu-button").addClass("light");
        }
        $(".login-menu").fadeTo("slow", 1);
    });
}

// If a user has a preexisting account, they can sign in. This will load their theme preferences and their highscore.
const verifyLogin = function (){
    const emailField = $('#email').val();
    const passwordField = $('#password').val();
    if (emailField == "" || emailField == " " || passwordField == "" || passwordField == " "){
        $("#error-message").replaceWith(`<p id="error-message">Empty fields are not allowed.</p>`)
    }
    else{
        firebase.auth().signInWithEmailAndPassword(emailField, passwordField)
            .then((userCredential) => {
                $("#error-message").replaceWith(`<p id="success-message">Login successful! Go back to the main menu.</p>`);
                currentUserId = userCredential.user.uid;
                db.collection("users").doc(userCredential.user.uid).get().then((doc) => {
                    if(doc.data().theme == "light"){
                        isLight = true;
                        $("html").attr("class","light");
                        $(".track-container").addClass("light");
                        $(".track").addClass("light");
                        $(".menu-container").addClass("light");
                        $(".menu-button").addClass("light");
                        $(".hit-accuracy").addClass("light");
                        $(".hit-combo").addClass("light");
                    }
                    else{
                        isLight = false;
                        $("html").removeClass("light");
                        $(".track-container").removeClass("light");
                        $(".track").removeClass("light");
                        $(".menu-container").removeClass("light");
                        $(".menu-button").removeClass("light");
                        $(".hit-accuracy").removeClass("light");
                        $(".hit-combo").removeClass("light");
                    }
                });
                isLoggedIn = true;
                $('#email-cell').remove();
                $('#password-cell').remove();
                $("#login-user-button").remove();
                $("#signup-button").remove();
            })
            .catch((error) => {
                $("#error-message").replaceWith(`<p id="error-message">${error.message}</p>`)
            });
    }
}

// This will render the UI that will prompt the user to sign up.
// This is needed to save scores for the leaderboard. 
const renderSignup = function (){
    $(".login-menu").fadeOut("slow", function () {
        $(".login-menu").replaceWith(
            `<div class = "signup-menu">
                <table id="signup-field">
                    <tbody>
                        <tr id="error-cell"><td><p id="error-message"></p></td></tr>
                        <tr id="email-cell"><td><label for = "email">Email: </label><input id="email" type="text"></td></tr>
                        <tr id="username-cell"><td><label for = "username">Username:   </label><input id="username" type="text"></td></tr>
                        <tr id="password-cell"><td><label for = "password">Password:   </label><input id="password" type="password"></td></tr>
                    </tbody>
                </table>
                <button type="button" class="menu-button" id="signup-user-button">Sign Up</button>
                <button type="button" class="menu-button" id="login-back-button">Login Instead</button>
                <button type="button" class="menu-button" id="back-button">Back to Menu</button>
                </div>`);
        $(".signup-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// If the user decides to login instead of sign up, they can do so using this function. 
const renderBackLogin = function (){
    $(".signup-menu").fadeOut("slow", function () {
        $(".signup-menu").replaceWith(
            `<div class = "login-menu">
                <table id="login-field">
                    <tbody>
                        <tr id="error-cell"><td><p id="error-message"></p></td></tr>
                        <tr id="email-cell"><td><label for = "email">Email: </label><input id="email" type="text"></td></tr>
                        <tr id="password-cell"><td><label for = "password">Password:   </label><input id="password" type="password"></td></tr>
                    </tbody>
                </table>
                <button type="button" class="menu-button" id="login-user-button">Login</button>
                <button type="button" class="menu-button" id="signup-button">Sign Up Instead</button>
                <button type="button" class="menu-button" id="back-button">Back to Menu</button>
                </div>`);
        $(".login-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// Renders the landing page after going to the login menu. 
const renderLoginBackMenu = function (){
    $(".login-menu").fadeOut("slow", function () {
        let logString = 
        `<div class="main-menu">
                <button type="button" class="menu-button" id="play-button">Play Game!</button>`;
                if (isLoggedIn){
                    logString += `<button type="button" class="menu-button" id="signout-button">Sign Out</button>`;
                }
                else{
                    logString += `<button type="button" class="menu-button" id="login-button">Login</button>`;
                }
                logString += `<button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                <button type="button" class="menu-button" id="controls-button">Controls</button>
                <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score! 
                <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
            </div>`;
        $(".login-menu").replaceWith(
            logString);
        $(".main-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// Renders the landing page after going to the login menu. 
const renderSignupBackMenu = function (){
    $(".signup-menu").fadeOut("slow", function () {
        let signString = 
        `<div class="main-menu">
                <button type="button" class="menu-button" id="play-button">Play Game!</button>`;
                if (isLoggedIn){
                    signString += `<button type="button" class="menu-button" id="signout-button">Sign Out</button>`;
                }
                else{
                    signString += `<button type="button" class="menu-button" id="login-button">Login</button>`;
                }
                signString += `<button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                <button type="button" class="menu-button" id="controls-button">Controls</button>
                <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score! 
                <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
            </div>`
        $(".signup-menu").replaceWith(
            signString);
        $(".main-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// Verifies the user entered fields and then approves them 
const verifySignUp = function() {
    const emailField = $('#email').val();
    const usernameField = $('#username').val();
    const passwordField = $('#password').val();

    if (emailField == "" || emailField == " " || usernameField == "" || usernameField == " " || passwordField == "" || passwordField == " "){
        $("#error-message").replaceWith(`<p id="error-message">Empty fields are not allowed.</p>`)
    }
    else{
        firebase.auth().createUserWithEmailAndPassword(emailField, passwordField)
            .then((userCredential) => {
                let themeColor = isLight ? "light" : "dark";
                $("#error-message").replaceWith(`<p id="success-message">Signup and Login Successful! Go back to the main menu.</p>`)
                db.collection("users").doc(userCredential.user.uid).set({
                    email: emailField,
                    username: usernameField,
                    highscore: 0,
                    theme: themeColor,
                });
                currentUserId = userCredential.user.uid;
                isLoggedIn = true;

                $('#email-cell').remove();
                $('#password-cell').remove();
                $("#username-cell").remove();
                $("#signup-user-button").remove();
                $("#login-back-button").remove();
                if(themeColor == "light"){
                    isLight = true;
                    $("html").attr("class","light");
                    $(".track-container").addClass("light");
                    $(".track").addClass("light");
                    $(".menu-container").addClass("light");
                    $(".menu-button").addClass("light");
                    $(".hit-accuracy").addClass("light");
                    $(".hit-combo").addClass("light");
                }
                else{
                    isLight = false;
                    $("html").removeClass("light");
                    $(".track-container").removeClass("light");
                    $(".track").removeClass("light");
                    $(".menu-container").removeClass("light");
                    $(".menu-button").removeClass("light");
                    $(".hit-accuracy").removeClass("light");
                    $(".hit-combo").removeClass("light");
                }
            })
            .catch((error) => {
                $("#error-message").replaceWith(`<p id="error-message">${error.message}</p>`)
            });
    }
}

// This will render the leaderboard of the game. Not yet implemented but will contact firebase to allow user
// to see who is leading, but they can also sign-up and register their score. 
const renderLeaderboard = function () {
    $(".main-menu").fadeOut("slow", function () {
        $(".main-menu").replaceWith(
            `<div class = "leaderboard-menu">
                    <table id="leaderboard-field">
                        <tbody>
                        <tr id="leaderboard-header">
                            <th>Username    </th>
                            <th>Scores  </th>
                        </tr>
                        <tr id="user-1">
                            <td id="username-user-1"></td>
                            <td id="score-user-1"></td>
                        </tr>
                        <tr id="user-2">
                            <td id="username-user-2"></td>
                            <td id="score-user-2"></td>
                        </tr>
                        <tr id="user-3">
                            <td id="username-user-3"></td>
                            <td id="score-user-3"></td>
                        </tr>
                        <tr id="user-4">
                            <td id="username-user-4"></td>
                            <td id="score-user-4"></td>
                        </tr>
                        <tr id="user-5">
                            <td id="username-user-5"></td>
                            <td id="score-user-5"></td>
                        </tr>
                        <tr id="user-6">
                            <td id="username-user-6"></td>
                            <td id="score-user-6"></td>
                        </tr>
                        <tr id="user-7">
                            <td id="username-user-7"></td>
                            <td id="score-user-7"></td>
                        </tr>
                        <tr id="user-8">
                            <td id="username-user-8"></td>
                            <td id="score-user-8"></td>
                        </tr>
                        <tr id="user-9">
                            <td id="username-user-9"></td>
                            <td id="score-user-9"></td>
                        </tr>
                        <tr id="user-10">
                            <td id="username-user-10"></td>
                            <td id="score-user-10"></td>
                        </tr>
                        </tbody>
                    </table>
                    <button type="button" class="menu-button" id="back-button">Back to Menu</button>
                    </div>`);
        getLeaderboardData();
        $(".leaderboard-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// Gets the top 10 highscores and renders this on the leaderboard. 
const getLeaderboardData = function (){
    db.collection("users").orderBy("highscore", "desc").get().then((querySnapshot) => {
        let counter = 0;
        querySnapshot.forEach((doc) => {
            counter++;
            $(`#user-${counter}`).replaceWith(
                `<tr id="user-${counter}">
                    <td id="username-user-${counter}">${doc.data().username}</td>
                    <td id="score-user-${counter}">${doc.data().highscore}</td>
                </tr>`);
        });
    });
}

// This will render the controls of the game as well as a back button that will take the user back to the main menu
const renderControls = function () {
    $(".main-menu").fadeOut("slow", function () {
        $(".main-menu").replaceWith(
            `<div class = "controls-menu">
            <p id="controls-tag"> Use the arrow keys to hit the note when it approaches the keys at the top of the screen!</p>
            Music Volume: <input type="range" id="volume-slider" value="${parseInt(document.getElementById("audio-song").volume * 100)}">
            <button type="button" class="menu-button" id="back-button">Back to Menu</button>
        </div>`);
        $(".controls-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// This will render that start such that the notes will begin to fall and the user will need to start
// AKA this changes the animation-play-state of the notes from "paused" to "running" 
const renderGameStart = function () {
    $("#game-title").fadeOut("slow");
    $("#author-tag").fadeOut("slow");
    $(".main-menu").fadeOut("slow", function () {
        $(".main-menu").replaceWith(
            `<div class="game-menu">
            <h1 class="timer"></h1>
            <button type="button" class="game-button" id="end-button">End Game</button>
            <div id="video"></div>
            <div class="results"></div>
        </div>`);
        $(".game-menu").fadeTo("slow", 1);
        $(".note").css("animation-play-state", "running");
        
        renderVideo();
        startTimer(song.duration);
        if(isLight){
            $(".game-button").addClass("light");
        }
    });
}

// If a user would like to end the game early, this ends the game. 
const endGame = function() {
    isEnded = true;
    $('.note').each(function(){
        hits.miss++;
    })
}

// Once the game ends, i.e. the timer interval is cleared, this will render the results from the
// user's performance. 
const renderGameEndMenu = function () {
    $(".game-menu").fadeOut("slow", function () {
        $("#rameses-dance").fadeOut("slow");
        $("#game-title").fadeIn("slow");
        $("#author-tag").fadeIn("slow", function () {
            let backMenu = 
            `<div class="main-menu">
                            <button type="button" class="menu-button" id="play-button">Play Game!</button>`
                            if (isLoggedIn){
                                backMenu += `<button type="button" class="menu-button" id="signout-button">Sign Out</button>`;
                            }
                            else {
                                backMenu += `<button type="button" class="menu-button" id="login-button">Login</button>`;
                            }
                            backMenu +=
                            `<button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                            <button type="button" class="menu-button" id="controls-button">Controls</button>
                            <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                            <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score!
                            <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                            <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
                        </div>`
            $(".game-menu").replaceWith(
                backMenu);
            $(".main-menu").fadeIn("slow");
            if(isLight){
                $(".menu-button").addClass("light");
            }
        });
    });
    song.tracks.forEach(function (track) {
        track.next = 0;
    });
    combo = 0;
    maxCombo = 0;
    score = 0;
    isEnded = false;
    hits = {
        perfect: 0,
        good: 0,
        okay: 0,
        miss: 0,
    }
}

// Returns the user back to the main menu if they would like to return from the leaderboard.
const renderLeaderboardBackMenu = function () {
    $(".leaderboard-menu").fadeOut("slow", function () {
        let backMenu = 
            `<div class="main-menu">
                            <button type="button" class="menu-button" id="play-button">Play Game!</button>`
                            if (isLoggedIn){
                                backMenu += `<button type="button" class="menu-button" id="signout-button">Sign Out</button>`;
                            }
                            else {
                                backMenu += `<button type="button" class="menu-button" id="login-button">Login</button>`;
                            }
                            backMenu +=
                            `<button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                            <button type="button" class="menu-button" id="controls-button">Controls</button>
                            <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                            <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score!
                            <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                            <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
                        </div>`
            $(".leaderboard-menu").replaceWith(
                backMenu);
        $(".main-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}

// Returns the user back to the main menu if they would like to return from the controls. 
const renderControlsBackMenu = function () {
    $(".controls-menu").fadeOut("slow", function () {
        let backMenu = 
            `<div class="main-menu">
                            <button type="button" class="menu-button" id="play-button">Play Game!</button>`
                            if (isLoggedIn){
                                backMenu += `<button type="button" class="menu-button" id="signout-button">Sign Out</button>`;
                            }
                            else {
                                backMenu += `<button type="button" class="menu-button" id="login-button">Login</button>`;
                            }
                            backMenu +=
                            `<button type="button" class="menu-button" id="leaderboard-button">Leaderboard</button>
                            <button type="button" class="menu-button" id="controls-button">Controls</button>
                            <button type="button" class="menu-button" id="toggle-theme-button">Toggle Theme</button>
                            <p id="about-tag"> About: It’s the night of the big game, and Rameses needs your help to get the crowd pumped up! Hit the arrow keys on beat to get the best score!
                            <br><span id="login-warning"> Make sure to login/sign-up first to save your highscore & load theme preferences!</span>
                            <br><span id="browser-warning"> *Best played in fullscreen! (F11 mode), please disable any AdBlockers as well. Thank you.</span> </p>
                        </div>`
            $(".controls-menu").replaceWith(
                backMenu);
        $(".main-menu").fadeTo("slow", 1);
        if(isLight){
            $(".menu-button").addClass("light");
        }
    });
}


// Will render all the notes of the song first with them being initiall hidden but all the animations have been pre-rendered. 
const renderNotes = function () {
    $('.track-container').empty();
    song.tracks.forEach(function (track, trackIndex) {
        const $addTrack =
            $(`<div class="track" id="track-${trackIndex}">
            </div>`);
        track.notes.forEach(function (note, noteIndex) {
            const $addNote =
                $(`<div class="note" id="note-${noteIndex}"></div>`);
            $addNote.css({
                "background-color": `${track.color}`,
                "animation-name": "moveUp",
                "animation-timing-function": "linear",
                "animation-duration": `${note.duration}` + "s",
                "animation-delay": `${note.delay}` + "s",
                "animation-play-state": "paused",
            });
            $addTrack.append($addNote);
        });
        $(".track-container").append($addTrack);
    });
}

// This function loads the timer and handles events for when the user misses a note and presses a key for a note.
const startTimer = function (duration) {
    startTime = Date.now();
    let $timer = $('.timer');
    let timeDuration = duration;
    let minutes = 0;
    let seconds = 0;

    const songDuration = setInterval(function () {
        minutes = Math.floor(timeDuration / 60);
        seconds = timeDuration % 60;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        const newTime = minutes + ":" + seconds;
        $timer.text(newTime);
        timeDuration--;
        if (timeDuration < 0 || isEnded) {
            clearInterval(songDuration);
            renderNotes();
            document.getElementById('audio-song').pause();
            document.getElementById('audio-song').currentTime = 0;
            if (isLoggedIn){
                db.collection("users").doc(currentUserId).get().then((doc) => {
                    const newScore = doc.data().highscore > score ? doc.data().highscore : score; 
                    if (newScore){
                        db.collection("users").doc(currentUserId).update({
                            highscore: newScore,
                        });
                    }
                });
            }
            $("#video").fadeOut("slow");
            const results =
                `<div class ="results-summary"> <p id="results-header">Results Summary: </p></div>
                    <div class = "score">Score: ${score}</div>
                    <div class = "max-combo">Max Combo: ${maxCombo}</div>
                    <div class = "perfect-hit">Perfect: ${hits.perfect}</div>
                    <div class = "good-hit">Good: ${hits.good}</div>
                    <div class = "okay-hit">Okay: ${hits.okay}</div>
                    <div class = "miss-hit">Miss: ${hits.miss}</div>`;
            renderCrowd();
            $('.results').append(results);
            $('.game-menu').append(`<button type="button" class="menu-button" id="back-button">Back to Menu</button>`);
            if(isLight){
                $(".menu-button").addClass("light");
            }
            $(`#rameses-dance`).fadeOut("slow")
            $(`#end-button`).fadeOut("slow", function(){
                $('.results').fadeIn("slow");
            $('#back-button').fadeIn("slow");
            $timer.fadeOut('slow', function () {
                $('.hit-display').fadeOut("slow", function () {
                    $(`.hit-display`).replaceWith(`<div class = "hit-display">
                            <div class="countdown"></div>
                            <div class="hit-combo"></div>
                            <div class="hit-accuracy"></div>
                            </div>`);
                });
            });
            });
        }
    }, 1000);
    document.getElementById("audio-song").play();
    $("#rameses-dance").fadeTo("slow", 1);
    $("#end-button").fadeTo("slow", 1);
}

// function utilized to determine what key is pressed. 
const handleKeys = function () {
    $(document).on("keydown", function (keyEvent) {
        let keyPressed = findKeyIndex(keyEvent.key);

        if ($(`#track-${keyPressed}`).children().length > 0) {
            calculateHit(keyPressed);
        }
    });
}

// Helper method to determine what key pressed corresponds to song object. 
const findKeyIndex = function (keyPressed) {
    if (keyPressed === "ArrowLeft") {
        return 0;
    }
    else if (keyPressed === "ArrowUp") {
        return 1;
    }
    else if (keyPressed === "ArrowDown") {
        return 2;
    }
    else {
        return 3;
    }
}

// Renders how accurate the user's keystroke is to the note. 
const renderAccuracyDisplay = function (hit) {
    $('.hit-accuracy').attr('id', `accuracy-${hit}`);
    $('.hit-accuracy').text(`${hit}`);
}

// Used to catch all missed notes within the game
const calculateMiss = function () {
    $(`.track-container`).on("animationend", function (event) {
        const keyIndex = $(event.target).parent().attr('id').charAt(6);
        renderAccuracyDisplay('miss');
        updateHits('miss');
        updateCombo('miss');
        updateMaxCombo();
        updateNextNote(keyIndex);
        event.target.remove();
    });
}

// Used to determine various properties of the user's action. 
const calculateHit = function (keyIndex) {
    const timeCalc = (Date.now() - startTime) / 1000;
    const nextNoteIndex = song.tracks[keyIndex].next;
    const nextNote = song.tracks[keyIndex].notes[nextNoteIndex];
    const perfectTime = nextNote.duration + nextNote.delay;
    const accuracy = Math.abs(timeCalc - perfectTime);

    if (accuracy > (nextNote.duration) / 4) {
        return;
    }

    const hitCalculation = judgeHitPrecision(accuracy);
    renderAccuracyDisplay(hitCalculation);
    updateHits(hitCalculation);
    updateCombo(hitCalculation);
    updateMaxCombo();
    calculateScore(hitCalculation);
    $(`#track-${keyIndex}`).children(`#note-${nextNoteIndex}`).remove();
    updateNextNote(keyIndex);
}

// Determines how on-beat a keystroke is to the notes of teh game.
const judgeHitPrecision = function (accuracy) {
    if (accuracy < 0.1) {
        return 'perfect';
    } else if (accuracy < 0.2) {
        return 'good';
    } else if (accuracy < 0.3) {
        return 'okay';
    } else {
        return 'miss';
    }
}

// Manipulates the global array of hits and increments to whatever was hit. 
const updateHits = function (hitText) {
    hits[hitText]++;
}

// Manipulates the global combo count and increments it. 
const updateCombo = function (hitText) {
    if (hitText === "miss" || hitText === "okay") {
        combo = 0;
        $('.hit-combo').text('');
    }
    else {
        $('.hit-combo').text(++combo);
    }
}

// Keeps track of the largest combo the user has managed to get playing the game. 
const updateMaxCombo = function () {
    maxCombo = maxCombo > combo ? maxCombo : combo;
}

// Calculates the user's total score. 
const calculateScore = function (hit) {
    if (combo >= 50) {
        score += 100 * score_multiplier[hit] * score_multiplier.combo50;
    }
    else if (combo >= 30) {
        score += 100 * score_multiplier[hit] * score_multiplier.combo30;
    }
    else {
        score += 100 * score_multiplier[hit];
    }
}

// Updates the next note of the track. 
const updateNextNote = function (keyIndex) {
    song.tracks[keyIndex].next++;
}

const handleVolumeControl = function (event) {
    const volumeLevel = event.target.value / 100;
    document.getElementById("audio-test").volume = volumeLevel;
    document.getElementById("audio-test").play();
    document.getElementById("audio-song").volume = event.target.value / 100;
}

// These are all the Third-Party API calls that will be utilized in the game
// Namely renders the gif at the end of the game and renders the video that plays during the game

// This uses the GIPHY API to render in UNC football team gif.
const renderCrowd = async function(){
    $.ajax({
        "url": "https://api.giphy.com/v1/gifs/l0NhWHDm0mmp1cY00?api_key="+ GIPHY_KEY,
        "method": "GET",
    }).then(function(response){
        const gifString = response.data.images.original.mp4;
        const videoHTML = 
        `<video id="crowd-win" width="320" height="240" autoplay muted loop>
            <source src="${gifString}" type="video/mp4">
        </video>
        <p id="crowd-text">You may have been rickrolled, but you rallied everyone up just in time for the game!</p>`;
        $(".results").append(videoHTML);
    }).catch((error) => {
        console.log(error)
    })
}

// This uses the Youtube Data API to render the UNC Rick Roll video.
const renderVideo = async function (){
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        data: {
            key: YOUTUBE_KEY,
            id: "HMUEHyVJzXM",
            part: "player",
            maxResults: 1,
            type: 'video',
            videoEmbeddable: true,
        },
        success: function(data){
            let videoLink = data.items[0].player.embedHtml;
            let fields = videoLink.split(/[\"]/);
            fields = fields.filter(function(part){
                return part.includes("youtube.com")
            });
            const videoTag = 
            `<div id="video"><iframe id="ytplayer" type="text/html" width="480" height="270"
            src="${fields[0]}?autoplay=1&mute=1&controls=0&playlist=HMUEHyVJzXM&loop=1&modestbranding=1&enablejsapi=1"
            frameborder="0"></iframe></div>`;
            $('#video').fadeIn("slow", function(){
                $("#video").replaceWith(videoTag);
            });
        },
        error: function(response){
            console.log("Request Failed");
        }
      });
}

// On window load, this will render the initial state. 
$(function () {
    loadGame();
    $("html").attr("class","light");
    $(".track-container").addClass("light");
    $(".track").addClass("light");
    $(".menu-container").addClass("light");
    $(".menu-button").addClass("light");
    $(".hit-accuracy").addClass("light");
    $(".hit-combo").addClass("light");
});