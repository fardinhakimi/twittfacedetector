
var socket = io()

socket.connect('http://localhost:3000')

// tweet item
var tweetItem = {

    template: `<li v-bind:id= "tweet.fileName"><img class="tweet-image" v-bind:src= "tweet.fileUrl"></li>`,
    props: ['tweet'],
}

var statsSideBar = {

    data() {
        return {
            trackTerm: 'trump',
        }
    },

    methods: {

        updateTracker(event) {
            socket.emit("updateTracker", { "trackerTerm": this.trackTerm })
        }
    },
    
    created() {
        this.updateTracker()
    },

    template: `
                <div>
                    <div class="filter-titles">
                    <h3>Filter and stats</h3>
                    </div>

                    <div class="tweet-tracker-container">
                    <label>Track by: </label>
                    <input type="text" name="track-term" id="track-term" v-model="trackTerm" v-on:keyup.13="updateTracker($event)" />
                    </div>

                    <div class="tweet-stats">
                    <p><b>Stats:</b></p>
                    <p>Tweets per hour:</p>
                    <p>male faces per hour:</p>
                    <p>female faces per hour:</p>
                    </div>
                </div>`
}

var tweetTracker = new Vue({

    el: '#app',

    components: {
        'tweet-item': tweetItem,
        'stats-side-bar': statsSideBar
    },

    data: {
        tweetList: [],
        maxTweetPerPage: 11
    },

    methods: {

        appendTweet(tweet) {

            if (tweet.fileName && tweet.fileUrl) {

                this.tweetList.push(tweet)

                if (this.tweetList.length >= this.maxTweetPerPage) {
                    this.removeTweet()
                }
            }
        },

        removeTweet() {
            var removeAble = this.tweetList.shift()
            socket.emit("deleteProcessedPicture", { "src": removeAble.fileUrl })
        }
    }
})

socket.on("tweet", (tweet) => {

    tweetTracker.appendTweet(tweet)
})