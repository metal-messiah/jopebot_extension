var channel;
var streamerData;
var channelConfig;
var ngrokURL;
var viewer;
var viewerid;
var cid;
var postToJopeBot, switchPanels;

var gotSongs = false;
// Get the party started
$(function () {



	$(".nav-button").click((e) => {
		//// console.log(e)
		// console.log("SHOW " + e.currentTarget.dataset["panel"])
		$(".nav-button").removeClass("active");
		$(e.currentTarget).addClass("active");

		$(".panel").addClass("hidden");
		$(`#${e.currentTarget.dataset["panel"]}`).removeClass("hidden").show()
	})

	var RI = document.getElementById("requestInput")
	RI.addEventListener("input", function () {
		// console.log("VALIDATE");
		if ($(`#requestInput`).val()) {
			$("#submitRequest").removeAttr("disabled");
		} else {
			$("#submitRequest").attr("disabled", "disabled");
		}
	})

	$("#submitRequest").click(() => {
		$("#outMsg").html("<i class='fas fa-crosshairs fa-spin'></i>")
		var tier = $("#requestType").val()
		// console.log(tier)
		var msg = $(`#requestInput`).val();
		// console.log(msg)

		outObj = {
			type: "request",
			data: {
				type: "filter",
				song: '',
				artist: '',
				album: '',
				genre: '',
				charter: '',
				requestedBy: viewer,
				msg: msg,
				tier: tier
			}
		};
		// console.log(viewer, msg, tier, ngrokURL)
		if (msg && channel && streamerData.isValid) {
			// $.post(ngrokURL + "/update", outObj, function (resp) {
			// 	if (resp != "error") {
			// 		$(`#requestInput`).val('');
			// 		$("#outMsg").html(resp)
			// 	} else {
			// 		$("#outMsg").html("<h2><i class='fas fa-exclamation-triangle'></i>Streamer did not receive request</h2><hr>" + outMsgState)
			// 	}
			// })

			if (
				(tier == "suggest" && channelConfig.allow_suggestions) ||
				(tier == "standard" && channelConfig.allow_standard_requests) ||
				(tier == "priority" && channelConfig.allow_priority_requests) ||
				(tier == "vip" && channelConfig.allow_vip_requests)
			) {
				$.post("https://www.jopebot.com/extension/desktop", {
					channel: channel,
					data: outObj
				}, function (resp) {
					if (resp != "error") {
						$(`#requestInput`).val('');
						$("#outMsg").html(resp)
					} else {
						$("#outMsg").html("<h2><i class='fas fa-exclamation-triangle'></i>Streamer did not receive request</h2><hr>")
					}
				})
			} else {
				$("#outMsg").html("Streamer has recently disabled that request type! (Failed to Send)")

			}
		}
	})

	let getJopebotData = (repeat) => {
		if (viewer) {
			$("#splash").addClass("hidden");
			$("#authorized").removeClass("hidden");
		} else {
			$("#splash").removeClass("hidden");
			$("#authorized").addClass("hidden");
		}
		// console.log(`GET JOPEBOT DATA FOR ${channel}`)
		viewerparam = viewer || '';
		jQuery.get(`https://www.jopebot.com/api/data/?channel=${channel}&config=true&ngrok=true&songscount=true&played=true&mytoken=${viewerparam}&requestlist=true&donorlist=true&suggestions=true`, function (jopebotData) {
			streamerData = jopebotData;
			if (jopebotData.isValid) {


				if (!jopebotData.config.allow_standard_requests) {
					$("#standardOption").prop("selected", false).hide().html(`Standard Request (${jopebotData.config.standard_request_tokens} ${jopebotData.config.currency_alias})`)
				} else {
					$("#standardOption").show().html(`Standard Request (${jopebotData.config.standard_request_tokens} ${jopebotData.config.currency_alias})`);
				}
				if (!jopebotData.config.allow_priority_requests) {
					$("#priorityOption").prop("selected", false).hide().html(`Priority Request (${jopebotData.config.priority_request_tokens} ${jopebotData.config.currency_alias})`);
				} else {
					$("#priorityOption").show().html(`Priority Request (${jopebotData.config.priority_request_tokens} ${jopebotData.config.currency_alias})`);;
				}
				if (!jopebotData.config.allow_vip_requests) {
					$("#vipOption").prop("selected", false).hide().html(`VIP Request (${jopebotData.config.vip_request_tokens} ${jopebotData.config.currency_alias})`);
				} else {
					$("#vipOption").show().html(`VIP Request (${jopebotData.config.vip_request_tokens} ${jopebotData.config.currency_alias})`);;
				}
				if (!jopebotData.config.allow_suggestions) {
					// $("#suggestOption").attr("disabled", "disabled");
					$("#suggestOption").prop("selected", false).hide()
				} else {
					// $("#suggestOption").removeAttr('disabled');
					$("#suggestOption").show()
				}

				var tabs = 0

				if (!jopebotData.config.submit_panel) {
					$("#requestTab").hide()
					$("#request").hide()
				} else {
					$("#requestTab").show()
					tabs++
				}
				if (!jopebotData.config.request_list_panel) {
					$("#requestListTab").hide()
					$("#requestList").hide()
				} else {
					$("#requestListTab").show()
					tabs++
				}
				if (!jopebotData.config.suggestions_panel) {
					$("#suggestionsTab").hide()
					$("#suggestions").hide()
				} else {
					$("#suggestionsTab").show()
					tabs++
				}
				if (!jopebotData.config.viewer_info_panel) {
					$("#selfTab").hide()
					$("#self").hide()
				} else {
					$("#selfTab").show()
					tabs++
				}
				if (!jopebotData.config.played_panel) {
					$("#playedTab").hide()
					$("#played").hide()
				} else {
					$("#playedTab").show()
					tabs++
				}
				if (!jopebotData.config.songs_panel) {
					$("#musicTab").hide()
					$("#music").hide()
				} else {
					$("#musicTab").show()
					tabs++
					if (!gotSongs) {
						getSongs(jopebotData.config.version, channel, jopebotData.config);
					}
				}

				var tabWidth = tabs ? 100 / tabs : 100

				//console.log(`${tabWidth}%`)
				$(".nav-button").css("width", `${tabWidth}%`)

				$("#offline").addClass("hidden");
				$("#online").removeClass("hidden");

				$(".channel").html(channel)
				var userStatus = jopebotData.donorlist.includes(viewer) ? `<span class='donor'>${viewer}</span>` : `${viewer}`
				$(".viewer").html(userStatus)

				$("#songLink").prop("href", `http://jopebot.com/request/?channel=${channel}&v=${viewerid}`)
				$("#playedLink").prop("href", `http://jopebot.com/played/?channel=${channel}`)
				$("#selfLink").prop("href", `http://jopebot.com/me/?channel=${channel}&v=${viewerid}`)
				$("#requestlistLink").prop("href", `http://jopebot.com/?channel=${channel}`);
				$("#suggestionsLink").prop("href", `http://jopebot.com/suggestions/?channel=${channel}&v=${viewerid}`)



				//// SONGS PANEL ////
				if (jopebotData.songscount) {
					$("#songs").html(`${jopebotData.songscount.toLocaleString()} Songs Found`)
				} else {
					$("#songs").html(`${channel} has not connected their songs.json file to JopeBot`)
				}
				//// PLAYED PANEL ////
				if (jopebotData.played.length) {
					$("#playedContent").html('')
					var playedArr = jopebotData.played;
					var length = playedArr.length - 5 >= 0 ? playedArr.length - 5 : 0;
					var playedSongs = playedArr.slice(length).map(song => {
						var userStatus = jopebotData.donorlist.includes(song.username) ? `<span class='donor'>${song.username}</span>` : `${song.username}`
						return `<li>${userStatus}<br>${song.req}</li>`
					})
					$("#playedContent").html(playedSongs.join(""));
				} else {
					$("#playedContent").html("No requests have been played yet");
				}

				//// SELF PANEL ////

				var tokens, date;
				if (jopebotData.mytoken) {
					tokens = jopebotData.mytoken.tokens;
					date = jopebotData.mytoken.date;
				} else {
					tokens = 0;
					date = "1/1/1961";
				}


				var mySuggestions = jopebotData.suggestions.filter(suggestion => suggestion.username == viewer)




				let reqIndex = jopebotData.requestlist.findIndex((request) => {
					return request.username == viewer
				})

				if (reqIndex >= 0) {
					var myReq = jopebotData.requestlist[reqIndex];
					var place = reqIndex + 1;
					var output = "<b>Request:</b> " + myReq.req + "<hr><b>" + jopebotData.config.priority_alias + ":</b> " + myReq.isPriority + "<hr><b>VIP:</b> " + myReq.isVIP + "<hr><b>Queue:</b> " + place + "<hr><b>Suggestions:</b><div>" + mySuggestions.map(suggestion => `${suggestion.req} - ${suggestion.likes.length.toLocaleString()} <i class='fas fa-heart'></i>`).join("<br>") + "</div><hr><b>" + jopebotData.config.currency_alias + ":</b> " + tokens.toFixed(3);
					//client.say(channel, output);
				} else {
					var output = "<b>Request:</b> " + "N/A" + "<hr><b>" + jopebotData.config.priority_alias + ":</b> " + "N/A" + "<hr><b>VIP:</b> " + "N/A" + "<hr><b>Queue:</b> " + "N/A" + "<hr><b>Suggestions:</b><div>" + mySuggestions.map(suggestion => `${suggestion.req} - ${suggestion.likes.length.toLocaleString()} <i class='fas fa-heart'></i>`).join("<br>") + "</div><hr><b>" + jopebotData.config.currency_alias + ":</b> " + tokens.toFixed(3);
					//client.say(channel, output);
				}
				$("#selfContent").html(output)


				//// REQUEST LIST ////
				if (jopebotData.requestlist.length) {
					$("#requestlistContent").html('');

					var requestlist = jopebotData.requestlist.slice(0, 5).map(song => {
						var userStatus = jopebotData.donorlist.includes(song.username) ? `<span class='donor'>${song.username}</span>` : `${song.username}`
						return `<li>${userStatus}<br>${song.req}</li>`
					})
					$("#requestlistContent").html(requestlist.join(""));
				} else {
					$("#requestlistContent").html("There's nothing on deck...<br>Now's your chance!!");
				}

				//// SUGGESTIONS LIST ////
				if (jopebotData.suggestions.length) {
					$("#suggestionsContent").html("");
					var {
						suggestions
					} = jopebotData


					suggestions.sort((a, b) => b.likes.length - a.likes.length)

					suggestions = suggestions.splice(0, 3);

					var suggests = "";
					suggestions.forEach(suggestion => {

						suggests += `
                    	<div data-username="${suggestion.username}" data-id="${suggestion.id}" class='suggestionItem'>
                        	<b>${suggestion.username}</b>
                        	<br> 
                        	${suggestion.req}
                        	<br>
							<div class="likesPreview"><div style='opacity:1; color:orange;'>
								${suggestion.likes.length.toLocaleString()}
							</div>
						</div>
						<div class='likesCount'>
							${suggestion.likes.length.toLocaleString()} <i class='fas fa-heart' style='margin:2px;'></i>
						</div>
						</div>
						`;
					})

					$("#suggestionsContent").html(suggests)

					// $(".suggestionItem").click(function (e) {
					// 	var id = $(e.currentTarget).data("id")
					// 	bot.likedSuggestionClick(id)
					// });

					$(".suggestionItem").hover(function (e) {
							// console.log("HOVER OVER")
							var panel = e.currentTarget.children[e.currentTarget.children.length - 1];
							var preview = e.currentTarget.children[e.currentTarget.children.length - 2];
							// console.log(panel, preview)

							$(preview).slideUp(100, function () {
								$(panel).slideDown(200);
							});

						},
						function (e) {
							setTimeout(function () {
								// console.log("HOVER OUT")
								var panel = e.currentTarget.children[e.currentTarget.children.length - 1];
								var preview = e.currentTarget.children[e.currentTarget.children.length - 2];
								$(panel).slideUp(200, function () {
									$(preview).slideDown(100);
								});
							}, 250)

						});

				}
				else{
					$("#suggestionsContent").html("<span class='text-block'>There's nothing here... yet</span>")
				}



				//$("#splash").addClass("hidden");
				if (jopebotData.ngrok) {
					ngrokURL = jopebotData.ngrok;
				}
				if (jopebotData.config) {
					var {
						config
					} = jopebotData;

					channelConfig = config;
				}
			} else {
				$("#offline").removeClass("hidden");
				$("#online").addClass("hidden");

			}

			if (repeat) {
				setTimeout(() => {
					getJopebotData(true)
				}, 30000)
			}
		})
	}

	// Twitch function handlers
	var twitch = window.Twitch.ext;
	var firstTimeOnly = true;
	var latestAuth = {};

	// This bit of disgustingness is to deal with a bug (28/11/2017) in the Twitch JS Helper.
	// Normally you would call listen for the whisper channel inside onAuthorized when you get
	// your opaque ID, however, calling twitch.listen inside onAuthorise causes the listen
	// function to be registered more than one time for some reason. So we wait for onAuth to
	// be called and then register the listener here.
	function whisperHack() {
		if (!firstTimeOnly) {
			// Listen to this viewer's private PubSub whisper channel
			twitch.listen('whisper-' + latestAuth.userId, (target, type, msg) => {
				// console.log("New Twitch PubSub whisper:", msg);
			});
		} else {
			setTimeout(whisperHack, 1000);
		}
	}
	whisperHack();

	// onAuth handler. Gives us JWT and the viewer's opaque ID
	twitch.onAuthorized((auth) => {
		// console.log("Twitch: onAuthorized called");
		// console.log("The channel ID is", auth.channelId);
		// // console.log("The extension clientId is", auth.clientId);
		// console.log("My Twitch opaque user id is", auth.userId);
		// console.log("The JWT token is", auth.token);
		cid = auth.clientId;
		// console.log("AUTH -> ", auth)

		$.ajax({
			url: `https://api.twitch.tv/helix/users?id=${auth.channelId}`,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Client-ID", auth.clientId);
			},
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json',
			processData: false,
			success: function (data) {
				//   alert(JSON.stringify(data));
				channel = data.data[0].login;
				getJopebotData(true);

				latestAuth = auth;
				// console.log("SEND TOKEN TO JOPEBOT")
				$.post("https://www.jopebot.com/extension", {
					token: auth.token
				}, function (answer) {
					// console.log(answer);
					//// console.log("CID", cid)
					// console.log("USER ID", answer.user_id)
					if (answer.user_id) {
						$.ajax({
							url: `https://api.twitch.tv/helix/users?id=${answer.user_id}`,
							beforeSend: function (xhr) {
								xhr.setRequestHeader("Client-ID", cid);
							},
							type: 'GET',
							dataType: 'json',
							contentType: 'application/json',
							processData: false,
							success: function (data) {
								viewer = data.data[0].login;
								var packet = {
									viewerid: answer.user_id,
									viewername: viewer
								}
								viewerid = answer.user_id;
								//console.log(packet)
								$.post("https://www.jopebot.com/extension/viewername", packet, function (r) {
									//console.log(r)
								})
								getJopebotData(false);

							},
							error: function (err) {
								//   alert("Cannot get data");
								console.error(err)
							}
						});
					}
				})

			},
			error: function () {
				//   alert("Cannot get data");
				// console.log("ERROR GETTING USERNAME")
			}
		});





	});

	// Sub all viewers to the broadcast channel
	twitch.listen('broadcast', (target, type, msg) => {
		// console.log("New Twitch PubSub broadcast message:", msg);
	});

	// Error handler
	twitch.onError((err) => {
		// console.log("Twitch: onError called");
		// console.log("The error was", err);
	});

	// onContext handler. Providers viewer mode, resolution, delay and other stuff
	// This can be very spammy, commented out by default
	twitch.onContext((context, diff) => {
		// // console.log("Twitch: onContext called");
		// // console.log(context);
		// // console.log(diff);
	});



});