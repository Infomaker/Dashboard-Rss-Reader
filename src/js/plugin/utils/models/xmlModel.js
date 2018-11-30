import XmlHandler from '@infomaker/xml-handler'
import { createUUID } from 'Dashboard'

export default class XMLModel {
	constructor(xml) {
		this.xml = xml

		if (this.xml) {
			this.handler = new XmlHandler(this.xml)
		}
	}

	createXMLNodeContext(xpath) {
		let node = this.handler.getNode(xpath)
		let value = this.handler.getNodeValue(node)

		let context = {
			id: createUUID(),
			value: value,
			node: node.singleNodeValue ? node.singleNodeValue : node,
			xpath: xpath
		}

		if (context.node.attributes && context.node.attributes instanceof NamedNodeMap) {
			context.attributes = this.getAttributes(context.node)
		}

		return context
	}

	setXml(xml) {
		if (xml && typeof xml === 'string') {
			this.xml = xml
			this.handler = new XmlHandler(this.xml)
		} else {
			console.warn('Failed to set XML')
		}
	}

	resetXml() {
		this.handler = new XmlHandler(this.xml)
	}

	createLinkObject(linkNode) {
		let link = {
			id: createUUID(),
			node: linkNode,
			attributes: this.getAttributes(linkNode)
		}

		Object.keys(link.attributes).map(key => {
			Object.defineProperty(link, key, {
				get: () => {
					return link.attributes[key].value
				},
				set: (value) => {
					link.attributes[key].value = value
					link.attributes[key].node.textContent = value
				}
			})
		})

		return link
	}

	createLinks(xpath) {
		let ret = []
		let result = this.handler.getNodes(xpath)

		result.nodes.map(linkNode => ret.push(this.createLinkObject(linkNode)))

		return ret
	}
	
	setXMLNodeValue(xpath, value) {
		this.handler.createNodes(xpath)
		
		let elementNode = this.handler.getSourceNode(xpath)
		let attributeNode = this.handler.getNode(xpath)

		let nodeUpdated = null

		if (attributeNode.singleNodeValue) {
			this.handler.setNodeValue(attributeNode, value)
			nodeUpdated = attributeNode.singleNodeValue
		} else {
			this.handler.setNodeValue(elementNode, value)
			nodeUpdated = elementNode.singleNodeValue
		}

		return nodeUpdated
	}

	getAttributes(node) {
		let ret = {}
		
		for (let i = 0; i < node.attributes.length; i++) {
			let attribute = node.attributes[i]
			let name = attribute.name

			ret[name] = {
				node: attribute,
				value: attribute.value
			}
		}

		return ret
	}

	getXML() {
		const xmlSerializer = new XMLSerializer()
		
		return xmlSerializer.serializeToString(this.handler.xmlDOM).replace(/ xmlns=""/g, '')
	}
}