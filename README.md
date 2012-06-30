<h1>YouTube Data API</h1>

This is a simple library for the [YouTuba Data API 2.0](https://developers.google.com/youtube/2.0/developers_guide_protocol_audience). It allows you to get data in small chunks, hence faster performance.

<h4>Getting started!</h4>

``` js
	var ytd = new YouTubeData()
```

<h2>.get(options)</h2>

This is a semi-low-level function for requesting data.

``` js
ytd.get({
	url: 'users/' + userName + '/uploads'
	, startIndex: 10
	, count: 300
	, stream: true
	, chunk: 5
	, full: false
	, params: {
	orderBy: 'viewCount'
	}
	, start: function() {
		console.log('START')
	}
	, data: function(videos) { // This will be called 60 times in this case.
		// In this case `videos` is an array with length of 5.
		console.log(videos)
	}
	, end: function() {
		console.log('END')
	}
})
```

<h4>Options</h4>

* `url`: This string will be appended to the API's basic URL (https://gdata.youtube.com/feeds/api/).
* `startIndex`: The index where the feed's should start. (default: 1)
* `count`: The number of elem. (default: 25)
* `stream`: If `true`, the response will come in chunks. (default: `false`)
* `chunk`: If `stream` is `true`, this amount of data will be requested at a time. (default: 10; max: 50)
* `full`: If `false`, the returned videos' object will contain less information (personally, these are most cases enough). (default: false)
* `params`: This object can contain custom query parameters for the request URL. (key: value => &key=value)
* `start`: This function will be called, when `stream` is `true` and the requests start.
* `data`: This will be called, if `stream` is `false` when the whole request finished. If `stream` is `true`, it will be called, with every chunk.
* `end`: This will be called, when `stream` is `true` and the requests end.


<h2>Wrapping methods</h2>

<h6>.subscriptions(options)</h6>

Requests all the subscriptions of a user. The username has to be in the `user` option.

Sample:

``` js
ytd.subscriptions({
	user: 'userName'
	, stream: true
	, data: function(subscriptions) {
		console.log(subscriptions)
	}
})
```

<h6>.newVideos(options)</h6>

Requests all the new subscription videos of a user. The username has to be in the `user` option. If the `startIndex` and `count` not given, all of the videos will be requested.

<h6>.uploads(options)</h6>

Requests the uploads of a user. The username has to be in the `user` option.

<h6>.favorites(options)</h6>

Requests all the favorite videos of a user. The username has to be in the `user` option. If the `startIndex` and `count` not given, all of the videos will be requested.

<h6>.playlists(options)</h6>

Requests all the playlists of a user. The username has to be in the `user` option. If the `startIndex` and `count` not given, all of the videos will be requested.

<h6>.comments(options)</h6>

Requests the comments of a video. The video's ID has to be in the `videoId` option.

<h6>.profile(userName, callback)</h6>

Requests the a user's data.


<h2>Authentication methods</h2>

These functions help authenticate your app. For further information about [authentication](https://developers.google.com/youtube/2.0/developers_guide_protocol_oauth2#OAuth2_Client_Side_Web_Applications_Flow)

<h6>.login(options)</h6>

This requires two options: `client_id` and `redirect_url`. Then the function will navigate to Google's confirmation site.

<h6>.validate(params, cb)</h6>

This requires the parameters, which are in the hash after the confirmation. It needs to be an object. In order to make an object from the hash you can use the built-in `.parseParameters(hash)` method. The `callback` function will be called with the user's data.


<h2>Other methods</h2>

<h6>.getProfilePicture(userId)</h6>

<h6>.parseParameters(hash)</h6>


<h2>Properties</h2>

* `key`: Developer key.
* `defaultProfile`: The logged in user's profile.
* `access_token`: If the validation is over the given access_token will be stored.