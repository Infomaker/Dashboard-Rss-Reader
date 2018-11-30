import { Application, ViewUtil, createUUID } from 'Dashboard'

import { AppWrapper, Header, Title, Description, List } from './style'

const Scrollable = ViewUtil.Scrollable

export default class RssReader extends Application {
	constructor(props) {
		super(props)

		if (props.config && typeof props.config === 'object') {
			this.config = props.config
		} else {
			console.error('@plugin_bundle missing config!')
			return null
		}

		this.state = {
			url: props.config.url || props.config.defaultUrl,

			refresh: props.config.refresh || props.config.defaultRefresh,

			extractors: {
				...props.config.defaultExtractors,
				...props.config.extractors
			},

			itemExtractors: {
				...props.config.defaultItemExtractors,
				...props.config.itemExtractors
			},
		}
	}

	componentDidMount() {
		this.on('rss:update', userData => {
			this.setState({
				link: userData.link,
				items: userData.items,
				header: userData.header,
				language: userData.language,
				description: userData.description,
			})
		})

		this.ready('@plugin_bundle-agent', () => {
			const { url, refresh, extractors, itemExtractors } = this.state

			this.send({
				name: 'rss:listen',
				userData: {
					url: url,
					refreshRate: refresh,
					extractors: extractors,
					itemExtractors: itemExtractors
				}
			})
		})
	}

	render() {
		let { itemExtractors, language, link, header, items = [], description } = this.state

		const results = items.map(item => {
			return {
				id: createUUID(),
				title: item.title,
				author: item.extra,
				content: item.description,
				onClick: () => item.link ? window.open(item.link) : null
			}
		})

		const inLineDescription = itemExtractors && itemExtractors.description && itemExtractors.description.inLine

		return (
			<AppWrapper>
				<Header hasUrl={link ? true : false} onClick={() => link ? window.open(link) : null}>
					<Title text={header}/>
					<Description text={description}/>
				</Header>

				<Scrollable autoHide={true}>
					<List
						items={results}
						inLine={inLineDescription}
						direction={language && language.indexOf('ar') >= 0 ? 'rtl' : 'ltr'}
					/>
				</Scrollable>
			</AppWrapper>
		)
	}
}