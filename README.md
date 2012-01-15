<h1>YouTube Framework</h1>

This is a little JavaScript module for the YouTube data, and player API. It requires [jQuery](https://github.com/jquery/jquery). 

<h2>ytf</h2>

<h3>Retrieving videos</h3>

If you retrieving videos, the returned array will contain a simplified structure, to handle it easier. The structure looks like this:

``` js
	{
		author: {
			name: 'YTF',
			type: 'partner'
		},
		comments: {
			count: 99,
			link: 'https://gdata.youtube.com/feeds/api/videos/d5bEny17MVo/comments?v=2.1'
		},
		desc: 'This a video description.',
		duration: 60,
		id: 'd5bEny17MVo',
		keywords: 'apple, banana, orange, pear',
		pusblished: '2007-10-02T08:10:50.000Z',
		rating: {
			numDislikes: 0,
			numLikes: 9999
		},
		statistics: {
			favoriteCount: '999',
			viewCount: '100000'
		},
		thumbnail: [
			{
				height: 90,
				time: '00:02:25',
				url: 'http://i.ytimg.com/vi/d5bEny17MVo/default.jpg'
			},
			.
			.
			.
		],
		title: 'YouTube API'
	}
```

<h4>Video function structure</h4>
This is the basic structure of every video and playlist request.

* <b>start</b> - The start index of the requested videos. (<i>optional</i>, default 1)
* <b>num</b> - The amount of videos you want to get. If it is `'all'` it gives you all requested videos. (<i>optional</i>, default 50)
* <b>order</b> - The order of the videos. Can be: <i>relevance</i>, <i>published</i>, <i>views</i>, <i>rating</i>.  (<i>optional</i>, default relevance (not everywhere))
* <b>data</b> - You can give to it an array and it will concatenate to the result. (<i>optional</i>)
* <b>complete:</b> function(<i>data</i>, <i>data2</i>) - When the request done, this function will be executed (data contains the result array, data2 is the concatenated array if you passed in array to the `data` parameter).
* <b>error:</b> function() - If there is an error, this function will be executed. (<i>optional</i>)

<h4>.search(Object)</h4>
* <b>key</b> - The key string for searching.

``` js
	ytf.search({
		key: 'YouTube API',
		start: 1,
		num: 25,
		order: 'published',
		complete: function(data) {
			console.log(data)
		},
		error: function() {
			console.log('Error!')
		}
	})
```

<h4>.related(Object)</h4>
* <b>id</b> - The ID of the video, for which you want to get the related videos.

``` js
	ytf.related({
		id: 'd5bEny17MVo',
		num: 'all',
		complete: function(data) {
			console.log(data)
		},
		error: function() {
			console.log('Error!')
		}
	})
```

<h4>.uploader.videos(Object)</h4>
Here the `order` is set to <i>published</i> by default.
* <b>name</b> - The name of the uploader, whose uploads you want to get.

``` js
	ytf.uploader.videos({
		name: 'GoogleDevelopers',
		num: 75,
		complete: function(data) {
			console.log(data)
		},
		error: function() {
			console.log('Error!')
		}
	})
```

<h4>.uploader.favorites(Object)</h4>
* <b>name</b> - The name of the uploader, whose favorites you want to get.

``` js
	ytf.uploader.favorites({
		name: 'GoogleDevelopers',
		num: 20,
		complete: function(data) {
			console.log(data)
		},
		error: function() {
			console.log('Error!')
		}
	})
```

<h4>.uploader.newVideos(Object)</h4>
If you are logged in, you can get the latest videos, that the people posted, whom you subscribed to. Here the `order` is set to <i>published</i> by default.

``` js
	ytf.uploader.videos({
		start: 1,
		num: 'all',
		complete: function(data) {
			console.log(data)
		}
	})
```

<h4>.uploader.playlists(Object)</h4>
* <b>name</b> - The name of the uploader, whose playlists you want to get.

``` js
	ytf.uploader.playlists({
		name: 'GoogleDevelopers',
		num: 'all',
		complete: function(data) {
			console.log(data)
		}
	})
```

<h4>.uploader.profile(name, callback)</h4>
This returns the profile of the <b>name</b> you passed in. This obviously has different structure than the videos.

``` js
	ytf.uploader.playlists('GoogleDevelopers', function(data) {
		console.log(data)
	})
```

<h3>Retrieving other data</h3>
<h4>.login(name, callback)</h4>
If you are logged in on your computer you can pass your username in, and it can get some of your data and your subscriptions. It stores an object of your data, that is like:

``` js
	ytf.data: {
		name: 'MyName',
		link: 'https://www.youtube.com/profile?user=MyName',
		subscriptions: [],
		thumbnail: 'url'
	}
```

``` js
	ytf.login('Me', function(data) {
		console.log(data)
	})
```