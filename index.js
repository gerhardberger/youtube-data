(function (name, definition) {
	if (typeof module != 'undefined') module.exports = definition();
	else if (typeof define == 'function' && define.amd) define(name, definition);
	else this[name] = definition();
})('YouTubeData', function() {

	var YouTubeApi = 'https://gdata.youtube.com/feeds/api/'
		, linkEnding = '&alt=json&v=2'
		, field      = '&fields=openSearch:startIndex,openSearch:totalResults,entry(author,gd:comments,gd:rating,media:group(media:category,media:description,media:keywords,media:thumbnail,yt:duration,yt:videoid),published,title,yt:statistics)'
	;

	function request(url, cb) {
		$.ajax({
			url: url,
			error: function(err) { cb(err); },
			success: function(data) { if (typeof data == 'string') data = JSON.parse(data); cb(undefined, data); }
		});
	}

	function makeParams(ps) {
		if (!ps) return '';
		if (typeof ps == 'string') return ps;
		var s = '';
		for (var i in ps) s += '&' + i + '=' + ps[i];
		return s;
	}

	// Composing the URL for the request
	function composeURL(os, isFull) {
		return YouTubeApi + os.url + (os.url.indexOf('?') > 0 ? '&' : '?') + 'start-index=' + os.startIndex
					+ '&max-results=' + os.count + linkEnding + (!_.isEmpty(YouTubeData.key) ? '&key='+YouTubeData.key : '')
					+ makeParams(os.params) + (os.full || isFull ? '' : field);
	}

	function totalURL(os) {
		var url = composeURL(os, true);

		return url + '&field=openSearch:totalResults';
	}

	function checkIxs(that) {
		if (that.ixs[that.ix]) {
			that.ixs[that.ix]();

			that.ix += that.chunk;
			checkIxs(that);
		}
	}

	function convertToObj(ps) {
		var o = {};
		for (var i in ps) o[ps[i].name] = ps[i].value;
		return o;
	}

	function Helper(os) {
		os.count = os.count || 25;
		os.startIndex = os.startIndex || 1;

		this.total = os.count;

		os.count = os.chunk = os.chunk || 10;
		if (os.stream) {
			this.chunk = os.chunk;
			this.ix    = 1;
			this.ixs   = {};
		}
		else this.result = [];
	}

	Helper.prototype.get = function(os, end) {
		var self = this
			, url
		;

		if (!os.stream) {
			// If the count higher than the limit (50)
			if (self.total === 0) {
				if (os.count > 50) os.count = 50;
			}

			url = composeURL(os);
			request(url, function(err, data) {
				if (err) return;
				self.result = self.result.concat(data.feed.entry);

				// If the requested videos are more than the total number the total number will be requested
				if (self.total > data.feed.openSearch$totalResults.$t) self.total = data.feed.openSearch$totalResults.$t;

				// If the count higher than the limit (50)
				self.total -= os.count;
				if (self.total > 0) {
					os.startIndex += os.count;
					os.count = self.total > 50 ? 50 : self.total;

					return self.get(os);
				}
				else return os.data(err, self.result);
			});
		}
		else {
			url = composeURL(os);
			request(url, function(err, data) {
				if (err) {					return;
				}
				if (self.ix == data.feed.openSearch$startIndex.$t) {
					if (data.feed.entry) os.data(err, err ? undefined : (data.feed.entry.length == 1 ? data.feed.entry[0] : data.feed.entry));
					else os.data(new Error('No more videos!'), data);
					self.ix += self.chunk;
					if (end && (os.end)) os.end();
					checkIxs(self);
				}
				else {
					self.ixs[data.feed.openSearch$startIndex.$t] = function() {
						if (data.feed.entry) os.data(err, err ? undefined : (data.feed.entry.length == 1 ? data.feed.entry[0] : data.feed.entry));
						else os.data(new Error('No more videos!'), data);
						if (end && (os.end)) os.end();
					};
				}
			});

			self.total -= os.count;
			if (self.total > 0) {
				os.startIndex += os.count;
				os.count = self.total < os.count ? self.total : os.count;
				
				return self.get(os, self.total == os.count ? true : undefined);
			}
		}
	};

	function YouTubeData() {
		this.key = '';
	}

	YouTubeData.prototype.login = function(os) {
		var self = this
			, url = 'https://accounts.google.com/o/oauth2/auth?response_type=token&scope=https://gdata.youtube.com' + makeParams(os);
		
		window.location.href = url;
	};

	YouTubeData.prototype.validate = function(ps_, cb) {
		var ps   = convertToObj(ps_)
			, self = this
		;

		window.location.hash = '#'

		if (!(ps.access_token && ps.expires_in && ps.token_type)) return;

		self.access_token = ps.access_token;


		request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + ps.access_token, function(err, res) {
			if (err) return;
			if (res.error) return cb(res.error);
			self.userId = res.user_id;
			cb(res);
		});
	};


	YouTubeData.prototype.getProfilePicture = function(userId) {
		return 'http://i3.ytimg.com/i/' + userId + '/1.jpg';
	};

	YouTubeData.prototype.parseParameters = function(ps) {
		return ps.substr(1).split('&').map(function(p_) {
			var p = p_.split('=');
			return {
				name: p[0],
				value: p[1]
			};
		});
	};

	YouTubeData.prototype.get = function(os) {
		var helper = new Helper(os);

		if (os.start) os.start();
		helper.get(os);

		return this;
	};



	// Wrapping functions

	YouTubeData.prototype.subscriptions = function(os) {
		var self = this;

		os.url   = 'users/' + os.user + '/subscriptions';
		os.full  = true;
		os.startIndex = 1;
		os.count = 1;
		request(totalURL(os), function(err, res) {
			if (err) return;
			os.count = res.feed.openSearch$totalResults.$t;
			self.get(os);
		});

		return this;
	};

	YouTubeData.prototype.newVideos = function(os) {
		var self = this;

		os.url   = 'users/' + os.user + '/newsubscriptionvideos' + (os.user == 'default' ? '?access_token=' + self.access_token : '');
		if ((!os.startIndex) && (!os.count)) {
			os.startIndex = 1;
			os.count = 1;
			request(totalURL(os), function(err, res) {
				if (err) return;
				os.count = res.feed.openSearch$totalResults.$t;
				self.get(os);
			});
		}
		else self.get(os);

		return this;
	};

	YouTubeData.prototype.search = function(os) {
		os.url = 'videos?q=' + os.key;

		this.get(os);

		return this;
	};

	YouTubeData.prototype.uploads = function(os) {
		os.url = 'users/' + os.user + '/uploads';

		this.get(os);

		return this;
	};

	YouTubeData.prototype.favorites = function(os) {
		var self = this;

		os.url   = 'users/' + os.user + '/favorites';
		if ((!os.startIndex) && (!os.count)) {
			os.startIndex = 1;
			os.count = 1;

			request(totalURL(os), function(err, res) {
				if (err) return;
				os.count = res.feed.openSearch$totalResults.$t;
				self.get(os);
			});
		}
		else self.get(os);

		return this;
	};

	YouTubeData.prototype.playlists = function(os) {
		var self = this;

		os.url   = 'users/' + os.user + '/playlists';
		os.full  = true;
		if ((!os.startIndex) && (!os.count)) {
			os.startIndex = 1;
			os.count = 1;

			request(totalURL(os), function(err, res) {
				if (err) return;
				os.count = res.feed.openSearch$totalResults.$t;
				self.get(os);
			});
		}
		else self.get(os);

		return this;
	};

	YouTubeData.prototype.comments = function(os) {
		var self = this;

		os.url   = 'videos/' + os.videoId + '/comments';
		os.full  = true;

		if ((!os.startIndex) && (!os.count)) {
			os.startIndex = 1;
			os.count = 1;

			request(totalURL(os), function(err, res) {
				if (err) return;
				os.count = res.feed.openSearch$totalResults.$t;
				self.get(os);
			});
		}
		else self.get(os);

		return this;
	};

	YouTubeData.prototype.profile = function(name, cb) {
		var self = this;
		request(YouTubeApi + 'users/' + name + '?v=2.1&alt=json' + (name == 'default' ? ('&access_token=' + self.access_token) : '', function(err, res) {
			if (name == 'default') self.defaultProfile = res.entry;
			cb(err, res);
		});
	};

	return YouTubeData;

});