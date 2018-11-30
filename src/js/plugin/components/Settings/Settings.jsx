import { GUI, Settings } from 'Dashboard'

export default class RssSettings extends Settings {
	application() {
		return (
			<GUI.Wrapper>
				<GUI.ConfigInput ref={ref => this.handleRefs(ref, 'url')} name='Enter RSS url' />
				<GUI.ConfigInput ref={ref => this.handleRefs(ref, 'refresh')} name='Feed update interval in minutes' validation={['numerical']} />

				<GUI.ConfigEditor
					json
					height={'auto'}
					defaultValue={{}}
					name={`Feed's extractors`}
					ref={ref => this.handleRefs(ref, 'extractors')}
				/>

				<GUI.ConfigEditor
					json
					height={'auto'}
					defaultValue={{}}
					name={`Feed's item extractors`}
					ref={ref => this.handleRefs(ref, 'itemExtractors')}
				/>
			</GUI.Wrapper>
		)
	}

	plugin() {
		return (
			<GUI.Wrapper>
				<GUI.ConfigInput ref={ref => this.handleRefs(ref, 'defaultUrl')} name='Enter default RSS url'/>
				<GUI.ConfigInput ref={ref => this.handleRefs(ref, 'defaultRefresh')} name='Default feed update interval in minutes' validation={['numerical']} />

				<GUI.ConfigEditor
					json
					height={'auto'}
					defaultValue={{}}
					name={`Feed's extractors`}
					ref={ref => this.handleRefs(ref, 'defaultExtractors')}
					staticValue={{
						title: '/*:rss/*:channel/*:title/text()',
						link: '/*:rss/*:channel/*:link/text()',
						description: '/*:rss/*:channel/*:description/text()',
						language: '/*:rss/*:channel/*:language/text()',
						items: '/*:rss/*:channel/*:item'
					}}
				/>

				<GUI.ConfigEditor
					json
					height={'auto'}
					defaultValue={{}}
					name={`Feed's item extractors`}
					ref={ref => this.handleRefs(ref, 'defaultItemExtractors')}
					staticValue={{
						link: {
							key: 'link',
							match: [],
							replace: [],
						},
						headline: {
							key: 'title',
							match: [],
							replace: [],
						},
						description: {
							key: 'description',
							match: [],
							replace: [],
						},
						extra: [
							{
								key: 'pubDate',
								match: [],
								replace: []
							},
							{
								key: 'author',
								match: [],
								replace: []
							}
						]
					}}
				/>
			</GUI.Wrapper>
		)
	}
}