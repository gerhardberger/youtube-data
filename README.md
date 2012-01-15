<h1>YouTube Framework</h1>

This is a little JavaScript module for the YouTube data, and player API. It requires [jQuery](https://github.com/jquery/jquery). 

<h2>Functions</h2>

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

* <b>start</b> - The start index of the requested videos. (optional, default 1)
* <b>num</b> - The amount of videos you want to get. If it is `'all'` it gives you all requested videos. (optional, default 50)
* <b>data</b> - You can give to it an array and it will concatenate to the result. (optional)
* <b>complete:</b> function(<i>data</i>, <i>data2</i>) - When the request done, this function will be executed (data contains the result array, data2 is the concatenated array if you passed in array to the `data` parameter).
* <b>error:</b> function() - If there is an error, this function will be executed. (optional)

<h4>.search(Object)</h4>

* <b>key</b> - The key string for searching.

``` js
	ytf.search({
		key: 'YouTube API',
		start: 1,
		num: 25,
		complete: function(data) {
			console.log(data)
		},
		error: function() {
			console.log('Error!')
		}
	})
```