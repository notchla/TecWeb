var cards = [
	{
		name: "php",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/php-logo_1.png"
	},
	{
		name: "php",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/php-logo_1.png"
	},
	{
		name: "eicmascript6",
		img: "https://s3.amazonaws.com/clarityfm-production/attachments/6604/default/es6.png?1442839695"
	},
	{
		name: "eicmascript6",
		img: "https://s3.amazonaws.com/clarityfm-production/attachments/6604/default/es6.png?1442839695"
	},
	{
		name: "html5",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/html5-logo.png"
	},
	{
		name: "html5",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/html5-logo.png"
	},
	{
		name: "jquery",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/jquery-logo.png"
	},
	{
		name: "jquery",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/jquery-logo.png"
	},
	{
		name: "javascript",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/js-logo.png"
	},
	{
		name: "javascript",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/js-logo.png"
	},
	{
		name: "node",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/nodejs-logo.png"
	},
	{
		name: "node",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/nodejs-logo.png"
	},
	{
		name: "photoshop",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/photoshop-logo.png"
	},
	{
		name: "photoshop",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/photoshop-logo.png"
	},
	{
		name: "python",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/python-logo.png"
	},
	{
		name: "python",
		img: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/74196/python-logo.png"
	}
];
// Global Arrays
// Access the <ul> with class of .deck
const deck = document.querySelector(".deck");
// Create an empty array to store the opened cards
let opened = [];
// Create an empty array to store the matched cards
let matched = 0;

// Access the modal
const modal = document.getElementById("modal");

// Access the reset button
const reset = document.querySelector(".reset-btn");
// Access the play again button
const playAgain = document.querySelector(".play-again-btn");

// Select the class moves-counter and change it's HTML
const movesCount = document.querySelector(".moves-counter");
// Create variable for moves counter, start the count at zero
let moves = 0;

// Get the span tag for the timer.
const timeCounter = document.querySelector(".timer");
// To use this variable to stop the time started in timer
let time;
// Create variables for time count, start all at zero
let minutes = 0;
let seconds = 0;
// For use in the click card event listener
let timeStart = false;

// Shuffle function from http://stackoverflow.com/a/2450976
function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

/*
Start Game: Shuffle the deck, create <li> tags and <img>
tags and append to the deck <ul> with the new shuffled content
*/
function startGame() {
	// Invoke shuffle function and store in variable
	const shuffledDeck = shuffle(cards);
	// Iterate over deck of cards array
	for (let i = 0; i < shuffledDeck.length; i++) {
		// Create the <li> tags
		const liTag = document.createElement('LI');
		// Give <li> class of card
		liTag.classList.add('card');
		// Create the <img> tags
		const addImage = document.createElement("IMG");
		// Append <img> to <li>
		liTag.appendChild(addImage);
		// Set the img src path with the shuffled deck
		addImage.setAttribute("src", shuffledDeck[i].img + "?raw=true");
		// Add an alt tag to the image
		addImage.setAttribute("alt", shuffledDeck[i].name + " on column " + (i % 4 + 1) + " and line " + (Math.floor(i/4) + 1) );

		// Update the new <li> to the deck <ul>
		deck.appendChild(liTag);
	}
}

/*
Remove all child nodes from the deck <li> tags and
<img> tags.  To be called in set everything function only
*/
function removeCard() {
	// As long as <ul> deck has a child node, remove it
	while (deck.hasChildNodes()) {
		deck.removeChild(deck.firstChild);
	}
}

function timer() {
	// Update the count every 1 second
	time = setInterval(function() {
		seconds++;
		if (seconds === 60) {
			minutes++;
			seconds = 0;
		}
		// Update the timer in HTML with the time it takes the user to play the game
		timeCounter.innerHTML = "<i class='fa fa-hourglass-start'></i>" + " Timer: " + minutes + " Mins " + seconds + " Secs" ;
	}, 1000);
}

/*
Stop the timer once the user has matched
all 16 cards, total of 8 pairs
Used: https://www.w3schools.com/js/js_timing.asp
*/
function stopTime() {
	clearInterval(time);
}

/*
Increment the moves counter.  To be called at each
comparison for every two cards compared add one to the count
*/
function movesCounter() {
	// Update the html for the moves counter
	movesCount.innerHTML ++;
	// Keep track of the number of moves for every pair checked
	moves ++;
}

/*
Compare two cards to see if they match or not
*/
function compareTwo() {
	// When there are 2 cards in the opened array
	if (opened.length === 2) {
		// Disable any further mouse clicks on other cards
		document.body.style.pointerEvents = "none";
	}
	// Compare the two images src
	if (opened.length === 2 && opened[0].src === opened[1].src) {
		// If matched call match()
		match();
	} else if (opened.length === 2 && opened[0].src != opened[1].src) {
		noMatch();
	}
}

/*
If the two cards match, keep the cards open and
apply class of match
*/
function match() {
	/* Access the two cards in opened array and add
	the class of match to the imgages parent: the <li> tag
	*/
	setTimeout(function() {
		opened[0].parentElement.classList.add("match");
		opened[1].parentElement.classList.add("match");
		// Push the matched cards to the matched array
		matched++;
		// Allow for further mouse clicks on cards
		document.body.style.pointerEvents = "auto";
		// Check to see if the game has been won with all 8 pairs
		winGame();
		// Clear the opened array
		opened = [];
	}, 600);
	// Call movesCounter to increment by one
	movesCounter();
}

/*
If the two cards do not match, remove the cards
from the opened array and flip the cards back over by
removing the flip class.
*/
function noMatch() {
	/* After 700 miliseconds the two cards open will have
	the class of flip removed from the images parent element <li>*/
	setTimeout(function() {
		// Remove class flip on images parent element
		opened[0].parentElement.classList.remove("flip");
		opened[0].parentElement.classList.add("hid");
		opened[1].parentElement.classList.remove("flip");
		opened[0].parentElement.classList.add("hid");
		// Allow further mouse clicks on cards
		document.body.style.pointerEvents = "auto";
		// Remove the cards from opened array
		opened = [];
	}, 700);
	// Call movesCounter to increment by one
	movesCounter();
}


function winGame() {
	if (matched >= 8) {
		stopTime();
		$('#game-scores').text(40 - moves);
		$('#win-game-modal').modal('toggle');
	}
}

function game_checker(){

	$(document).ready(function(){
		startGame();

		$('.deck').on("click", function(evt) {
			if (evt.target.nodeName === "LI") {
				// To console if I was clicking the correct element
				// Start the timer after the first click of one card
				// Executes the timer() function
				if (timeStart === false) {
					timeStart = true;
					timer();
				}
				// Call flipCard() function
				flipCard();
			}

			function flipCard() {
				evt.target.classList.add("flip");
				// Call addToOpened() function
				addToOpened();
			}

			//Add the fliped cards to the empty array of opened
			function addToOpened() {
				/* If the opened array has zero or one other img push another
				img into the array so we can compare these two to be matched
				*/
				if (opened.length === 0 || opened.length === 1) {
					// Push that img to opened array
					opened.push(evt.target.firstElementChild);
				}
				// Call compareTwo() function
				compareTwo();
			}
		});
	});
}
