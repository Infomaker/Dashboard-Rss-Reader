import { register } from 'Dashboard'

import Agent from '@components/Agent'
import Settings from '@components/Settings'
import RssReader from '@components/RssReader'

(() => {
	register({
		agent: Agent,
		settings: Settings,
		application: RssReader,
		bundle: "@plugin_bundle",
	})
})()