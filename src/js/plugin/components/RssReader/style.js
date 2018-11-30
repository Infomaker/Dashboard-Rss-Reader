import styled from 'styled-components'
import { GUI } from 'Dashboard'

const AppWrapper = styled(GUI.Wrapper)`
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
`

const Header = styled(GUI.Wrapper)`
	padding: 25px 20px 5px 20px;
	border-bottom: 1px solid #ededed;

	${props => {
		if (props.hasUrl) {
			return `
				cursor: pointer;

				&:hover {
					background: #f2f2f2;
				}
			`
		}
	}}
`

const Title = styled(GUI.Title)`
	color: #131313;
`

const Description = styled(GUI.Paragraph)`
	color: #8a8a8a;
`

export {
	AppWrapper,
	Header,
	Title,
	Description,
}