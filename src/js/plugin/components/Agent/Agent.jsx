import moment from 'moment'
import { Agent } from 'Dashboard'

import RssParser from '@utils/RssParser'

const dateFormats = [
	moment.ISO_8601,
	"MM/DD/YYYY HH*mm*ss",
	"YYYY/MM/DD HH*mm*ss",
]

export default class RssAgent extends Agent {
	constructor(props) {
		super(props)

		this.intervals = {}

		this.on('rss:listen', userData => {
			const { UUID, url, refreshRate, extractors, itemExtractors } = userData

			window.clearInterval(this.intervals[UUID])

			this.fetchAndSend({
				UUID,
				url,
				refreshRate,
				extractors,
				itemExtractors
			})

			this.intervals[UUID] = setInterval(() => {
				this.fetchAndSend({
					UUID,
					url,
					refreshRate,
					extractors,
					itemExtractors
				})
			}, this.min2ms(refreshRate) || 300000)
		})
	}

	min2ms(time) {
		let minutes = Number(time)
		let ms = minutes * 60 * 1000
		return ms
	}

	fetchAndSend({ url, UUID, refreshRate, extractors, itemExtractors }) {
		const cachedFeed = this.cache(url)

		if (cachedFeed && cachedFeed.items.length) {
			this.send({
				name: 'rss:update',
				targetUUID: UUID,
				userData: cachedFeed
			})
		} else {
			this.uncache(url)

			this.fetchRssFeed({ url, extractors, itemExtractors }).then(rss => {
				this.sendRssFeed({ url, UUID, refreshRate, itemExtractors, rss })
			}).catch(error => {
				console.warn(error)
			})
		}
	}

	fetchRssFeed({ url, extractors, itemExtractors }) {
		return new Promise((resolve, reject) => {
			this.request(url).then(res => res.text()).then(xmlfile => {
				const rssModel = new RssParser(xmlfile, extractors, itemExtractors)

				resolve(rssModel)
			}).catch(error => {
				reject(error)
			})
		})
	}

	sendRssFeed({ url, UUID, refreshRate, itemExtractors, rss }) {
		let language
		let items = []
		let link = null
		let header = null
		let description = null

		if (rss) {
			link = rss.link ? rss.link : null
			header = rss.title ? rss.title : url
			language = rss.language ? rss.language : null
			description = rss.description ? rss.description : null

			if (Array.isArray(rss.items)) {
				items = rss.items.map(item => {
					return {
						link: this.getTextFromFeedItem(item, itemExtractors.link),
						extra: this.getTextFromFeedItem(item, itemExtractors.extra),
						title: this.getTextFromFeedItem(item, itemExtractors.headline),
						description: this.getTextFromFeedItem(item, itemExtractors.description),
					}
				})
			}

			const payLoad = {
				link: link,
				items: items,
				header: header,
				language: language,
				description: description
			}

			this.send({
				name: 'rss:update',
				targetUUID: UUID,
				userData: payLoad
			})

			this.cache(url, payLoad, Date.now() + this.min2ms(refreshRate) - 100)
		}
	}

	getTextFromFeedItem(item, rules) {
		if (Array.isArray(rules) && rules.length) {
			let extra = []

			rules.forEach(rule => {
				let extraText = this.getTextFromFeedItem(item, rule)

				if (moment(extraText, dateFormats, true).isValid()) {
					extraText = moment(extraText).calendar()
				}

				extra.push(extraText)
			})

			return extra.filter(i => i).join(' | ')

		} else {
			const { key, replace, match } = rules

			let text = ''

			if (item && key && item[key]) {
				text = item[key]

				if (Array.isArray(match) && match.length) {
					match.forEach(i => {
						if (i && typeof i === 'object') {
							if (typeof i.regex === 'string') {
								const flags = i.regex.replace(/.*\/([gimy]*)$/, '$1')
								const pattern = i.regex.replace(new RegExp(`^/(.*?)/${flags}$`), '$1')
								const regex = new RegExp(pattern, flags)

								const matched = text.match(regex)

								if (matched && matched[0]) {
									text = matched[0]
								}
							}
						}
					})
				}

				if (Array.isArray(replace) && replace.length) {
					replace.forEach(i => {
						if (i && typeof i === 'object') {
							if (typeof i.value === 'string' && typeof i.with === 'string') {
								text = text.replace(i.value, i.with)
							} else if (typeof i.regex === 'string' && typeof i.with === 'string') {
								const flags = i.regex.replace(/.*\/([gimy]*)$/, '$1')
								const pattern = i.regex.replace(new RegExp(`^/(.*?)/${flags}$`), '$1')
								const regex = new RegExp(pattern, flags)

								text = text.replace(regex, i.with)
							}
						}
					})
				}
			}

			return text
		}
	}
}