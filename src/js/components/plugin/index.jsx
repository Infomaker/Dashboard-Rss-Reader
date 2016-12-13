import $ from "jquery"

((Dashboard, React) => {

	const GUI = Dashboard.GUI

	class RssReader extends Dashboard.Application {
		constructor(props){
			super(props)

			this.state = {
				config: props.config,
				url: props.config.url,  	// String, ex: http://www.breakit.se/feed/artiklar
				defaultUrl: props.config.defaultUrl, 	// String, ex: http://www.breakit.se/feed/artiklar
				refresh: props.config.refresh, 		// Intger, in minute, ex: 2
				defaultRefresh: props.config.defaultRefresh, 	// Intger, in minute, ex: 2
				items: []
			}

			// Listen to the new 'RSS FEED' from the agent.
			this.on('rss:update', userData => {
				this.setState({
					items: userData.items,
					rssLang: userData.rssLang
				})
			})

		}

		componentWillMount() {

			// Send the 'RSS URL FEED' and the 'Refresh Rate' to the agent.
			this.send({
				name: 'rss:listen',
				userData: {
					url: this.state.url || this.state.defaultUrl,
					refreshRate: this.state.refresh || this.state.defaultRefresh
				}
			})

		}

		render() {
			let header
			let { items = [] } = this.state

			const results = items.map(item => {
				header = item.header.toUpperCase()
				return {
					id: Dashboard.createUUID(),
					title: item.title,
					content: item.description,
					author: item.author,
					onClick: () => window.open(item.link)
				}
			})

			return (
				<GUI.Wrapper>
					<GUI.Title text={header || "No RSS FEED To Read ."} direction={this.state.rssLang ? 'rtl' : 'ltr'} />
					<GUI.List items={results} direction={this.state.rssLang ? 'rtl' : 'ltr'}/>
				</GUI.Wrapper>
			)
		}
	}

	class RssAgent extends Dashboard.Agent {
		constructor(config) {
			super(config)

			this.intervals = {}

			this.on('rss:listen', userData => {

				// Receive the 'RSS URL FEED' and the Refresh Rate time from the plugin.
				window.clearInterval(this.intervals[userData.UUID])
				this.sendRss(userData.url, userData.UUID, userData.refreshRate)
				
				this.intervals[userData.UUID] = setInterval(()=> {
					this.sendRss(userData.url, userData.UUID, userData.refreshRate)
				}, this.min2ms(userData.refreshRate) || 300000)
			})
		}

		// Convert from Minutes to Milliseconds.
		min2ms(time){
			let minutes = Number(time)
			let ms = minutes * 60 * 1000
			return ms
		}

		// Make a request and fetch for 'XML RSS FEED DATA'.
		sendRss(url, UUID, refreshRate) {
			let language
			let data = this.cache(url)
			let items = []

			// Check if the Local Storage if it's empty or not.
			if(data == null) {
				this.request(url, {}, xmlfile => {
					language = $(xmlfile).find("dc\\:language")
					language = language.length ? language[0].innerText === "ar" : false

					$(xmlfile).find("item").each(function () {
						var header = xmlfile.match(/<title[^\>]{0,}>(.*?)<\/title>/)[1].replace(/<\!\[CDATA\[/i, '').replace(/\]\]>/i, '')
						var el = $(this)
						let description = null // Will get the desc text

						const descriptionNode = el.find("description")
						const descriptionText = descriptionNode.text()
						const descriptionNodeFirstChild = descriptionNode[0].firstChild

						if (descriptionText) {
							description = descriptionText.replace(/<\!\[CDATA\[/i, '').replace(/\]\]>/i, '')
						} else if (descriptionNodeFirstChild) {
							let descriptionNodeFirstChildValue = descriptionNodeFirstChild.data || descriptionNodeFirstChild

							if (descriptionNodeFirstChildValue) {
								description = descriptionNodeFirstChildValue.replace("[CDATA[", "").replace("]]", "").replace("<b>", "").replace("</b>", "").replace("/>", "").replace("<p>", "").replace("</p>", "")
							}
						}

						items.push({
							header: header,
							title: el.find('title')[0].text.replace(/<\!\[CDATA\[/i, '').replace(/\]\]>/i, ''),
							description,
							link: el.find('link')[0].nextSibling.nodeValue
						})
					})

					// Send the 'RSS DATA' from the new request to the plugin.
					this.send({
						name: 'rss:update',
						targetUUID: UUID,
						userData: {
							items: items,
							rssLang: language
						}
					})

					this.cache(url, {items: items, language: language}, Date.now() + this.min2ms(refreshRate) - 100)

					if (items <= 0) {
						console.log('Failed to load rss feed !!')
					}
				})
			}

			// Send the 'RSS DATA' from the Local Storage to the plugin.
			else {
				this.send({
					name: 'rss:update',
					targetUUID: UUID,
					userData: {
						items: data.items,
						rssLang: data.language
					}
				})
				if (data.items <= 0) {
					console.log('Failed to load rss feed !!')
					this.uncache(url)
				}
			}
		}
	}

	class RssSettings extends Dashboard.Settings {

		// Set URL and Refresh Rate settings for the plugin.
		application() {
			return (
				<GUI.Wrapper>
					<GUI.ConfigInput ref="url" name="Enter RSS url" validation={['required']} />
					<GUI.ConfigInput ref="refresh" name="Feed update interval in minutes" validation={['required', 'numerical']} />
				</GUI.Wrapper>
			)
		}

		// Set default URL and default Refresh Rate settings for the plugin.
		plugin() {
			return (
				<GUI.Wrapper>
					<GUI.ConfigInput ref="defaultUrl" name="Enter RSS url" validation={['required']} />
					<GUI.ConfigInput ref="defaultRefresh" name="Feed update interval in minutes" validation={['required', 'numerical']} />
				</GUI.Wrapper>
			)
		}
	}

	Dashboard.register({
		bundle: "@plugin_bundle",
		name: "@plugin_name",
		author: "@plugin_author",
		graphic_url: "@graphic_url",
		version: "@plugin_version",

		application: RssReader,
		agent: RssAgent,
		settings: RssSettings
	})

})(window.Dashboard, window.React)
