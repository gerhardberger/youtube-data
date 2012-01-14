!function (name, definition) {
	if (typeof module != 'undefined') module.exports = definition()
	else if (typeof define == 'function' && define.amd) define(name, definition)
	else this[name] = definition()
}('ytf', function() {
	each = function(a,b) {
		for (var i in a)
			b.call(a[i], a[i], (_.isNull(parseInt(i)) ? i : parseInt(i)))
	}
	getVideos = function(str,s,m,r,err,ord,tp,fn) {
		$.getJSON(str+'v=2.1&alt=json&start-index='+s+'&max-results='+((m>50)?50:m)+'&orderby='+((ord=='views')?'viewCount':ord), function(data) {
			if (_.isNull(data)) {
				throw new Error('Error! Cannot load videos!')
				if (!_.isNull(err))	err.call()
				return
			}
			var list = _.map(data.feed.entry, function(e) {return (tp=='plist')?e:yt.simplify(e)})
			if ((m == Infinity) || (m > data.feed.openSearch$totalResults.$t)) m = data.feed.openSearch$totalResults.$t
			if (_.isEmpty(r))
				r = list
			else
				r = r.concat(list)

			if ((data.feed.openSearch$totalResults.$t > r.length) && (m > r.length))
				getVideos(str,s+50,m-50,r,err,ord,tp,fn)
			else
				fn.call(null, r)
		})
	}
	var yt = {
		data: {
			name: '',
			link: '',		
			thumbnail: '',
			subscriptions: []
		},
		login: function(name,fn) {
			if ((_.isEmpty(name)) || (name == this.data.name))
				return
			console.log(name+' is trying to log in...')
			$.getJSON('https://gdata.youtube.com/feeds/api/users/'+name+'?v=2.1&alt=json', function(data) {
				if (_.isNull(data)) {
					throw new Error('Error! Not existing username!')
					return
				}
				yt.data.name = data.entry.yt$username.$t
				yt.data.link = data.entry.link[0].href
				yt.data.thumbnail = data.entry.media$thumbnail.url
				yt.loadSubscriptions(1,fn)
				console.log(yt.data)
				console.log(yt.data.name+' logged in!')
			})
		},
		logout: function() {
			yt.data = {
				name: '',
				link: '',		
				thumbnail: '',
				subscriptions: []
			}	
		},
		loadSubscriptions: function(num,fn) {
			if (!_.isEmpty(this.subscriptions))
				return
			$.getJSON('https://gdata.youtube.com/feeds/api/users/'+this.data.name+'/subscriptions?v=2.1&start-index='+num+'&max-results=50&alt=json', function(data) {
				if (_.isNull(data)) {
					throw new Error('Error! Cannot load subscriptions!')
					return
				}
				yt.data.subscriptions = yt.data.subscriptions.concat(data.feed.entry)
				num += 50
				if (num < data.feed.openSearch$totalResults.$t)
					yt.loadSubscriptions(num,fn)
				else
					fn.call(null, yt.data)
			})
		},
		simplify: function(a) {
			return {
				published: a.published.$t,
				author: {
					name: (!_.isUndefined(a.author[0])) ? a.author[0].name.$t : null,
					type: a.media$group.media$credit.yt$type
				},
				comments: {
					link: (!_.isUndefined(a.gd$comments)) ? a.gd$comments.gd$feedLink.href : null,
					count: (!_.isUndefined(a.gd$comments)) ? a.gd$comments.gd$feedLink.countHint : null,
				},
				category: a.media$group.media$category.$t,
				duration: a.media$group.yt$duration.seconds,
				desc: a.media$group.media$description.$t,
				keywords: a.media$group.media$keywords.$t,
				thumbnail: a.media$group.media$thumbnail,
				title: a.media$group.media$title.$t,
				id: a.media$group.yt$videoid.$t,
				rating: a.yt$rating,
				statistics: a.yt$statistics
			}
		},
		newVideos: function(o) {
			if (_.isEmpty(yt.data))
				return
			var s = (o.start) ? o.start : 1
				, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : Infinity
				, ord = (o.order) ? o.order : 'published'
				, err = (o.error) ? o.error : null
			getVideos('https://gdata.youtube.com/feeds/api/users/'+yt.data.name+'/newsubscriptionvideos?',s,m,[],err,ord,'vid',function(data) {
				o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
			})
		},
		search: function(o) {
			var s = (o.start) ? o.start : 1
				, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
				, ord = (o.order) ? o.order : 'relevance'
				, err = (o.error)?o.error:null
			getVideos('https://gdata.youtube.com/feeds/api/videos?q='+o.key+'&',s,m,[],err, ord, 'vid', function(data) {
				o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
			})
		},
		related: function(o) {
			var s = (o.start) ? o.start : 1
				, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
				, ord = (o.order) ? o.order : 'relevance'
				, err = (o.error)?o.error:null
			getVideos('https://gdata.youtube.com/feeds/api/videos/'+o.id+'/related?',s,m,[],err, ord, 'vid', function(data) {
				o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
			})
		},
		uploader: {
			videos: function(o) {
				var s = (o.start) ? o.start : 1
					, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
					, ord = (o.order) ? o.order : 'published'
					, err = (o.error)?o.error:null
				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/uploads?',s,m,[],err, ord, 'vid', function(data) {
					o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
				})
			},
			favorites: function(o) {
				var s = (o.start) ? o.start : 1
					, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
					, ord = (o.order) ? o.order : 'relevance'
					, err = (o.error)?o.error:null
				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/favorites?',s,m,[],err, ord, 'vid', function(data) {
					o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
				})
			},
			playlists: function(o) {
				var s = (o.start) ? o.start : 1
					, m = (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
					, ord = (o.order) ? o.order : 'relevance'
					, err = (o.error)?o.error:null
				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/playlists?',s,m,[],err, ord, 'plist', function(data) {
					o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
				})
			},
			profile: function(name, fn) {
				$.getJSON('https://gdata.youtube.com/feeds/api/users/'+name+'?v=2.1&alt=json', function(data) {
					if (_.isNull(data)) {
						throw new Error('Error! Not existing user!')
						return
					}
					fn.call(null, data.entry)
				})
			}
		}
	}

	var tag = document.createElement('script')
	    tag.src = "http://www.youtube.com/player_api"
	    var firstScriptTag = document.getElementsByTagName('script')[0]
	    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
	var player = {
		data: {},
		load: function(v) {
			this.data = v
			player.video = new YT.Player('video', {
	      videoId: v.id,
				playerVars: {
					'autoplay': 1,
					'autohide': 1,
					'color': 'white',
					//'controls': 0,
					'modestbranding': 1,
					'showinfo': 0,
					'theme': 'light'
				},
				events: {
					'onStateChange': player.change
				}
	    })
		},
		change: function(event) {
			console.log(event)
		},
		comments: {
			list: [],
			load: function(fn) {
				player.comments.list = []
				$.getJSON('https://gdata.youtube.com/feeds/api/videos/'+player.data.id+'/comments?v=2.1&alt=json&start-index=1&max-results=50'+user.key, function(data) {
					if (_.isNull(data)) {
						console.log('Error! Cannot load comments!')
					return
					}
					player.comments.list = data.feed.entry
					fn.call(null, data.feed.openSearch$totalResults.$t)
				})
			},
			more: function(fn) {
				$.getJSON('https://gdata.youtube.com/feeds/api/videos/'+player.data.id+'/comments?v=2.1&alt=json&start-index='+player.comments.list.length+'&max-results=50'+user.key, function(data) {
					if (_.isNull(data)) {
						console.log('Error! Cannot load more comments!')
					return
					}
					player.comments.list = player.comments.list.concat(data.feed.entry)
					fn.call(null, data.feed.entry, data.feed.openSearch$totalResults.$t)
				})
			}
		},
		play: function() {
			player.video.playVideo()
		},
		pause: function() {
			player.video.pauseVideo()
		},
		stop: function() {
			player.video.stopVideo()
		},
		seekTo: function(num) {
			player.video.seekTo(num, true)
		},
		clear: function() {
			player.video.clearVideo()
		},
		mute: function() {
			player.video.mute()
		},
		unMute: function() {
			player.video.unMute()
		},
		isMuted: function() {
			return player.video.isMuted()
		},
		setVolume: function(num) {
			player.video.setVolume(num)
		},
		getVolume: function() {
			return player.video.getVolume()
		},
		getQuality: function() {
			return player.video.getPlaybackQuality()
		},
		setQuality: function(s) {
			player.video.setPlaybackQuality(s)
		},
		getURL: function() {
			return player.video.getVideoUrl()
		},
		getDuration: function() {
			return player.video.getDuration()
		}
	}

	return yt
})