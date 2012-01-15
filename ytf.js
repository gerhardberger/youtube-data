!function (name, definition) {
	if (typeof module != 'undefined') module.exports = definition()
	else if (typeof define == 'function' && define.amd) define(name, definition)
	else this[name] = definition()
}('ytf', function() {
	each = function(a,b) {
		for (var i in a)
			b.call(a[i], a[i], (isNull(parseInt(i)) ? i : parseInt(i)))
	}
	function isEmpty(a) {
		if (a instanceof Array || typeof a === 'string')
			return a.length===0
		for (var c in a)
			if(Object.prototype.hasOwnProperty.call(a,c))
				return!1
		return!0
	}
	function isFunction(a) {
		return! (!a || !a.constructor || !a.call || !a.apply)
	}
	function isUndefined(a) {
		return (a === void 0)
	}
	function isArray(a) {
		return (a instanceof Array)
	}
	function isObject(a) {
		return (a instanceof Object)
	}
	function isString(a) {
		return (typeof a === 'string')
	}
	isNull = function(a) {
    return a === null;
  };
  map = function(o,fn) {
    var results = []
    if (o == null) return results
    each(o, function(e, index, list) {
      results.push(fn.call(null,e))
    });
    return results;
  };
	var tag = document.createElement('script')
	    tag.src = "http://www.youtube.com/player_api"
	    var firstScriptTag = document.getElementsByTagName('script')[0]
	    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
	getVideos = function(str,s,m,r,err,ord,tp,fn) {
		$.getJSON(str+'v=2.1&alt=json&start-index='+s+'&max-results='+((m>50)?50:m)+'&orderby='+((ord=='views')?'viewCount':ord), function(data) {
			if (isNull(data)) {
				throw new Error('Error! Cannot load videos!')
				if (!isNull(err))	err.call()
				return
			}
			var list = map(data.feed.entry, function(e) {return (tp=='plist')?e:yt.simplify(e)})
			if ((m == Infinity) || (m > data.feed.openSearch$totalResults.$t)) m = data.feed.openSearch$totalResults.$t
			if (isEmpty(r))
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
			if ((isEmpty(name)) || (name == this.data.name))
				return
			console.log(name+' is trying to log in...')
			$.getJSON('https://gdata.youtube.com/feeds/api/users/'+name+'?v=2.1&alt=json', function(data) {
				if (isNull(data)) {
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
			if (!isEmpty(this.subscriptions))
				return
			$.getJSON('https://gdata.youtube.com/feeds/api/users/'+this.data.name+'/subscriptions?v=2.1&start-index='+num+'&max-results=50&alt=json', function(data) {
				if (isNull(data)) {
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
					name: (!isUndefined(a.author[0])) ? a.author[0].name.$t : null,
					type: a.media$group.media$credit.yt$type
				},
				comments: {
					link: (!isUndefined(a.gd$comments)) ? a.gd$comments.gd$feedLink.href : null,
					count: (!isUndefined(a.gd$comments)) ? a.gd$comments.gd$feedLink.countHint : null,
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
			if (isEmpty(yt.data))
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
					if (isNull(data)) {
						throw new Error('Error! Not existing user!')
						return
					}
					fn.call(null, data.entry)
				})
			}
		},
		player: {
			data: {},
			load: function(v) {
				this.data = v
				yt.player.video = new YT.Player('video', {
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
						'onStateChange': yt.player.change
					}
		    })
			},
			change: function(event) {
				console.log(event)
			},
			comments: {
				list: [],
				load: function(fn) {
					yt.player.comments.list = []
					$.getJSON('https://gdata.youtube.com/feeds/api/videos/'+yt.player.data.id+'/comments?v=2.1&alt=json&start-index=1&max-results=50'+user.key, function(data) {
						if (isNull(data)) {
							console.log('Error! Cannot load comments!')
						return
						}
						yt.player.comments.list = data.feed.entry
						fn.call(null, data.feed.openSearch$totalResults.$t)
					})
				},
				more: function(fn) {
					$.getJSON('https://gdata.youtube.com/feeds/api/videos/'+yt.player.data.id+'/comments?v=2.1&alt=json&start-index='+yt.player.comments.list.length+'&max-results=50'+user.key, function(data) {
						if (isNull(data)) {
							console.log('Error! Cannot load more comments!')
						return
						}
						yt.player.comments.list = yt.player.comments.list.concat(data.feed.entry)
						fn.call(null, data.feed.entry, data.feed.openSearch$totalResults.$t)
					})
				}
			},
			play: function() {
				yt.player.video.playVideo()
			},
			pause: function() {
				yt.player.video.pauseVideo()
			},
			stop: function() {
				yt.player.video.stopVideo()
			},
			seekTo: function(num) {
				yt.player.video.seekTo(num, true)
			},
			clear: function() {
				yt.player.video.clearVideo()
			},
			mute: function() {
				yt.player.video.mute()
			},
			unMute: function() {
				yt.player.video.unMute()
			},
			isMuted: function() {
				return yt.player.video.isMuted()
			},
			setVolume: function(num) {
				yt.player.video.setVolume(num)
			},
			getVolume: function() {
				return yt.player.video.getVolume()
			},
			getQuality: function() {
				return yt.player.video.getPlaybackQuality()
			},
			setQuality: function(s) {
				yt.player.video.setPlaybackQuality(s)
			},
			getURL: function() {
				return yt.player.video.getVideoUrl()
			},
			getDuration: function() {
				return yt.player.video.getDuration()
			}
		}
	}
	return yt
})