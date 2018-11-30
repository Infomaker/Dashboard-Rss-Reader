import XMLModel from '@utils/models/XMLModel'

export default class RssParser extends XMLModel {
	constructor(xml, extractors, itemExtractors) {
		super(xml)

		this.extractors = extractors
		this.itemExtractors = itemExtractors

		this.model = {
			data: this.extractXML()
		}

		this.defineModelWithFunctions()

		return this.model
	}

	defineModelWithFunctions() {
		Object.keys(this.model.data).map(key => {
			Object.defineProperty(this.model, key, {
				get: () => {
					return this.model.data[key].hasOwnProperty('value') ? this.model.data[key].value : this.model.data[key]
				},
				set: value => {
					console.warn('Trying to set ::::', value)
				}
			})
		})
	}

	getItems() {
		const itemsLinks = this.createLinks(this.extractors.items)
		let items = []

		itemsLinks.map(item => {
			const itemObject = {}

			Object.keys(item.node.children).map(key => {
				itemObject[item.node.children[key].tagName] = item.node.children[key].textContent
			})

			items.push(itemObject)
		})

		return items
	}

	extractXML() {
		const data = {
			title: this.createXMLNodeContext(this.extractors.title),
			link: this.createXMLNodeContext(this.extractors.link),
			description: this.createXMLNodeContext(this.extractors.description),
			language: this.createXMLNodeContext(this.extractors.language),
			items: this.getItems()
		}

		return data
	}
}