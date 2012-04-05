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
      results.push(fn.call(null,e,index))
    });
    return results;
  };
  getProfilePics_ = function(name,profiles_,len,cb,result,total) {
  	$.ajax({
  		url: 'http://gdata.youtube.com/feeds/api/users/'+name+'?v=2&alt=json&fields=media:thumbnail'
  		, error: function(err) {
  			console.log(err)
  			profiles_[name] = 'http://s.ytimg.com/yt/img/no_videos_140-vfl1fDI7-.png'
			 	if (_.keys(profiles_).length == len) {
			 		for (var i in result)
		  			result[i].author['pic'] = profiles_[result[i].author.name]
		  		
			 		if (total == -1) {
			 			yt.data.subscriptions = _.map(result, function(e) {
			 				return {
			 					name: e.author.name
			 					, pic: e.author.pic
			 				}
			 			})
			 			console.log(result)
			 			cb.call(null, yt.data)
			 		}
			 		else cb.call(null, result, total)
			 	}
  		}
  		, success: function(data) {
  			if (_.isString(data)) data = JSON.parse(data)
		 		profiles_[name] = data.entry.media$thumbnail.url
			 	if (_.keys(profiles_).length == len) {
			 		for (var i in result)
		  			result[i].author['pic'] = profiles_[result[i].author.name]
			 		if (total == -1) {
			 			yt.data.subscriptions = _.map(result, function(e) {
			 				return {
			 					name: e.author.name
			 					, pic: e.author.pic
			 				}
			 			})
			 			cb.call(null, yt.data)
			 		}
			 		else cb.call(null, result, total)
			 	}
	 		}
	 	})
  }
  getProfilePics = function(result, total, cb) {
  	var profiles = _.map(result, function(e) {
  		return e.author.name
  	})
  		, profiles_ = {}
  	profiles = _.uniq(profiles)

  	for (var i in profiles)
  		getProfilePics_(profiles[i], profiles_, profiles.length, cb, result, total)
  }

  normalizeVid = function(o,tp) {
  	return {
  		start: (o.start) ? o.start : 1
  		, max: (o.num) ? ((o.num == 'all')?Infinity:o.num) : 50
  		, ord: (o.order) ? o.order : 'relevance'
  		, err: (o.error) ? o.error : null
  		, pic: (!isUndefined(o.getProfilePics)) ? o.getProfilePics : true
  		, tp : tp
  	}
  }

	var tag = document.createElement('script')
	    tag.src = "http://www.youtube.com/player_api"
	    var firstScriptTag = document.getElementsByTagName('script')[0]
	    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
	getVideos = function(str, o, r, cb) {
		$.ajax({
			url: str+'v=2.1&alt=json&start-index='+o.start+'&max-results='+((o.max>50)?50:o.max)+'&orderby='+((o.ord=='views')?'viewCount':o.ord)
			, error: function(err) {
				o.err.call(null, err)
			}
			, success: function(data) {
				if (_.isString(data)) data = JSON.parse(data)
				var j      = data.feed.openSearch$startIndex.$t
					, total  = data.feed.openSearch$totalResults.$t
					, list   = map(data.feed.entry, function(e,i) {return (o.tp == 'plist') ? e : yt.simplify(e,i+j)})
					, theEnd = total == _.last(list).index
				if ((o.max == Infinity) || (o.max > total)) o.max = total
				r = (isEmpty(r)) ? list : r.concat(list)			

				if ((total > r.length) && (o.max > r.length) && (!theEnd)) {
					o.start += 50
					o.max   -= 50
					getVideos(str, o, r, cb)
				}
				else (o.pic) ? getProfilePics(r,total,cb) : cb.call(null, r, total)
			}
		})

	}
	var yt = {
		data: {
			name: '',
			link: '',		
			thumbnail: '',
			subscriptions: []
		},
		login: function(o) {
			if ((isEmpty(o.name)) || (o.name == this.data.name))
				return
			console.log(o.name+' is trying to log in...')
			$.ajax({
				url: 'https://gdata.youtube.com/feeds/api/users/'+o.name+'?v=2.1&alt=json',
				error: function() {
					o.error.call()
				},
				success: function(data) {
					if (_.isString(data)) data = JSON.parse(data)
					console.log(data)
					yt.data.name = data.entry.yt$username.$t
					yt.data.link = data.entry.link[0].href
					yt.data.thumbnail = data.entry.media$thumbnail.url
					yt.loadSubscriptions(1,(o.getProfilePics) ? o.getProfilePics : false, o.success)
					console.log(yt.data.name+' logged in!')
				}
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
		loadSubscriptions: function(num,pics,fn) {
			$.ajax({
				url: 'https://gdata.youtube.com/feeds/api/users/'+this.data.name+'/subscriptions?v=2.1&start-index='+num+'&max-results=50&alt=json'
				, error: function(err) {
					console.log(err)
				}
				, success: function(data) {
					if (_.isString(data)) data = JSON.parse(data)
					yt.data.subscriptions = yt.data.subscriptions.concat(data.feed.entry)
					num += 50
					if (num < data.feed.openSearch$totalResults.$t)
						yt.loadSubscriptions(num,pics,fn)
					else {
						yt.data.subscriptions = _.map(yt.data.subscriptions, function(e) { return e.yt$username.$t })
						if (pics) {
							yt.data.subscriptions = _.map(yt.data.subscriptions, function(e) {
								return {
									author: {
										name: e
									}
								}
							})
							getProfilePics(yt.data.subscriptions, -1, fn)
						}
						else
							fn.call(null, yt.data)
					}
				}
			})
		},
		simplify: function(a,i) {
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
				index: i,
				rating: a.yt$rating,
				statistics: (a.yt$statistics) ? a.yt$statistics : {viewCount: 0},
			}
		},
		newVideos: function(o) {
			var obj = normalizeVid(o, 'vid')
			obj.ord = 'published'
			obj.max = (o.num) ? ((o.num == 'all')?Infinity:o.num) : Infinity

			getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/newsubscriptionvideos?', obj, [], function(data, total) {
				o.complete.call(null, data, total, (o.data) ? o.data.concat(data) : null)
			})
		},
		search: function(o) {
			var obj = normalizeVid(o, 'vid')

			getVideos('https://gdata.youtube.com/feeds/api/videos?q='+o.key+'&', obj, [], function(data, total) {
				o.complete.call(null, data, total, (o.data) ? o.data.concat(data) : null)
			})
		},
		related: function(o) {
			var obj = normalizeVid(o, 'vid')

			getVideos('https://gdata.youtube.com/feeds/api/videos/'+o.id+'/related?', obj, [], function(data, total) {
				o.complete.call(null, data, total, (o.data) ? o.data.concat(data) : null)
			})
		},
		uploader: {
			videos: function(o) {
				var obj = normalizeVid(o, 'vid')
				obj.ord = 'published'

				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/uploads?', obj, [], function(data, total) {
					o.complete.call(null, data, total, (o.data) ? o.data.concat(data) : null)
				})
			},
			favorites: function(o) {
				var obj = normalizeVid(o, 'vid')

				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/favorites?', obj, [], function(data, total) {
					o.complete.call(null, data, total, (o.data) ? o.data.concat(data) : null)
				})
			},
			playlists: function(o) {
				var obj = normalizeVid(o, 'plist')

				getVideos('https://gdata.youtube.com/feeds/api/users/'+o.name+'/playlists?', obj, [], function(data) {
					o.complete.call(null, data, (o.data) ? o.data.concat(data) : null)
				})
			},
			profile: function(name, fn) {
				$.ajax({
					url: 'https://gdata.youtube.com/feeds/api/users/'+name+'?v=2.1&alt=json'
					, error: function(err) {
						console.log(err)
					}
					, success: function(data) {
						data = JSON.parse(data)
						fn.call(null, data.entry)
					}
				})
			}
		},
		spellCorrection: function(o) {
			$.ajax({
				url: 'https://gdata.youtube.com/feeds/api/videos?q='+o.key+'&alt=json&fields=link'
				, error: function(err) {
					o.error.call(null, err)
				}
				, success: function(data) {
					o.complete.call(null, _.filter(data.feed.link, function(e) {
						return e.rel == 'http://schemas.google.com/g/2006#spellcorrection'
					}))
				}
			})
		}
	}
	return yt
})